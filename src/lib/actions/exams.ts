
'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { redirect } from 'next/navigation';

const optionSchema = z.object({
  text: z.string().min(1, 'Option text cannot be empty.'),
  isCorrect: z.boolean().default(false),
});

const questionSchema = z.object({
  text: z.string().min(1, 'Question text cannot be empty.'),
  points: z.coerce.number().min(1, 'Points must be at least 1.'),
  options: z.array(optionSchema).min(2, 'At least two options are required.'),
});

const examSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().optional(),
  postId: z.string().min(1, 'A post must be selected.'),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).default('DRAFT'),
  durationMinutes: z.coerce.number().optional(),
  attemptsAllowed: z.coerce.number().min(0, 'Attempts must be 0 or more. 0 for unlimited.').default(1),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  questions: z.array(questionSchema).min(1, 'At least one question is required.'),
});

type ExamFormData = z.infer<typeof examSchema>;

export async function createOrUpdateExam(data: ExamFormData, examId?: number) {
    const session = await auth();
    const user = session?.user;

    if (!user) {
        throw new Error('Not authenticated');
    }

    const post = await prisma.post.findUnique({
        where: { id: parseInt(data.postId, 10) },
    });

    if (!post) {
        throw new Error('Associated post not found.');
    }
    
    const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;
    const isAuthor = post.authorId === user.id;

    if (!isSuperAdmin && !isAuthor) {
        throw new Error('Not authorized to create or edit an exam for this post.');
    }
    
    const examData = {
        title: data.title,
        description: data.description,
        status: data.status,
        durationMinutes: data.durationMinutes,
        attemptsAllowed: data.attemptsAllowed,
        startDate: data.startDate,
        endDate: data.endDate,
        postId: post.id,
    };

    if (examId) {
        // Update existing exam
        await prisma.$transaction(async (tx) => {
            await tx.exam.update({
                where: { id: examId },
                data: examData,
            });

            // Easiest way to handle question/option updates is to delete and recreate
            const existingQuestions = await tx.question.findMany({ where: { examId }});
            for (const q of existingQuestions) {
                await tx.questionOption.deleteMany({ where: { questionId: q.id }});
            }
            await tx.question.deleteMany({ where: { examId }});

            for (const q of data.questions) {
                const newQuestion = await tx.question.create({
                    data: {
                        examId: examId,
                        text: q.text,
                        points: q.points,
                    }
                });
                await tx.questionOption.createMany({
                    data: q.options.map(opt => ({
                        questionId: newQuestion.id,
                        text: opt.text,
                        isCorrect: opt.isCorrect,
                    })),
                });
            }
        });
    } else {
        // Create new exam
        await prisma.exam.create({
            data: {
                ...examData,
                questions: {
                    create: data.questions.map(q => ({
                        text: q.text,
                        points: q.points,
                        options: {
                            create: q.options.map(opt => ({
                                text: opt.text,
                                isCorrect: opt.isCorrect,
                            })),
                        },
                    })),
                },
            },
        });
    }

    revalidatePath(`/admin/exams`);
    revalidatePath(`/movies/${post.id}`);
}

export async function getExamForTaker(examId: number) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('You must be logged in to take an exam.');
    }

    const exam = await prisma.exam.findUnique({
        where: { id: examId, status: 'ACTIVE' },
        include: {
            questions: {
                include: {
                    options: {
                        select: {
                            id: true,
                            text: true,
                        },
                    },
                },
            },
        },
    });

    if (!exam) {
        return null;
    }
    
    // Check if user has already submitted and if attempts are allowed
    if (exam.attemptsAllowed > 0) {
        const submissionCount = await prisma.examSubmission.count({
            where: {
                examId: examId,
                userId: session.user.id,
            },
        });

        if (submissionCount >= exam.attemptsAllowed) {
            // Potentially redirect to results page or show an error
            throw new Error(`You have already submitted this exam the maximum number of times (${exam.attemptsAllowed}).`);
        }
    }

    // Check start/end dates
    const now = new Date();
    if (exam.startDate && now < exam.startDate) {
        throw new Error(`This exam is not available until ${exam.startDate.toLocaleString()}.`);
    }
    if (exam.endDate && now > exam.endDate) {
        throw new Error(`This exam is no longer available as of ${exam.endDate.toLocaleString()}.`);
    }

    return exam;
}

export async function submitExam(examId: number, formData: FormData) {
  'use server';
  const session = await auth();
  if (!session?.user) {
    throw new Error('Not authenticated.');
  }

  const answers = new Map<number, number>();
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('question-')) {
      const questionId = parseInt(key.split('-')[1], 10);
      const optionId = parseInt(value as string, 10);
      answers.set(questionId, optionId);
    }
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      questions: {
        include: {
          options: true,
        },
      },
    },
  });

  if (!exam) {
    throw new Error('Exam not found.');
  }

  let totalScore = 0;
  let submissionAnswers = [];

  for (const question of exam.questions) {
    const correctOption = question.options.find(o => o.isCorrect);
    const userAnswerId = answers.get(question.id);

    if (correctOption && userAnswerId === correctOption.id) {
      totalScore += question.points;
    }

    if (userAnswerId) {
        submissionAnswers.push({
            questionId: question.id,
            selectedOptionId: userAnswerId
        });
    }
  }

  const submission = await prisma.examSubmission.create({
    data: {
      score: totalScore,
      examId: examId,
      userId: session.user.id,
      answers: {
        create: submissionAnswers
      },
    },
  });
  
  revalidatePath(`/exams/${examId}`);
  redirect(`/exams/${examId}/results?submissionId=${submission.id}`);
}


export async function getExamResults(submissionId: number) {
    const session = await auth();
    const user = session?.user;
    if (!user) {
        throw new Error('Not authenticated.');
    }

    const submission = await prisma.examSubmission.findUnique({
        where: { id: submissionId },
        include: {
            exam: {
                include: {
                    questions: {
                        include: {
                            options: true,
                        }
                    }
                }
            },
            answers: {
                include: {
                    question: true,
                    selectedOption: true
                }
            }
        }
    });

    if (!submission || submission.userId !== user.id) {
        throw new Error('Submission not found or you are not authorized to view it.');
    }

    return submission;
}
