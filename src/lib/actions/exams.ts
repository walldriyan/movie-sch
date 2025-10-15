

'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const optionSchema = z.object({
  id: z.number().optional(),
  text: z.string().min(1, 'Option text cannot be empty.'),
  isCorrect: z.boolean().default(false),
});

const questionSchema = z.object({
  id: z.number().optional(),
  text: z.string().min(1, 'Question text cannot be empty.'),
  points: z.coerce.number().min(1, 'Points must be at least 1.'),
  isMultipleChoice: z.boolean().default(false),
  options: z.array(optionSchema).min(2, 'At least two options are required.')
    .refine(options => options.some(opt => opt.isCorrect), {
        message: 'At least one option must be marked as correct.'
    }),
});

const examSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().optional(),
  postId: z.string().min(1, 'A post must be selected.'),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).default('DRAFT'),
  durationMinutes: z.coerce.number().optional().nullable(),
  attemptsAllowed: z.coerce.number().min(0, 'Attempts must be 0 or more. 0 for unlimited.').default(1),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  questions: z.array(questionSchema).min(1, 'At least one question is required.'),
});

type ExamFormData = z.infer<typeof examSchema>;

export async function createOrUpdateExam(data: ExamFormData, examId?: number | null) {
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
    
    const questionsToCreate = data.questions.filter(q => !q.id);
    const questionsToUpdate = data.questions.filter(q => q.id);

    if (examId) {
        await prisma.$transaction(async (tx) => {
            await tx.exam.update({ where: { id: examId }, data: examData });

            const existingQuestionIds = (await tx.question.findMany({ where: { examId }, select: { id: true }})).map(q => q.id);
            const questionsToUpdateIds = questionsToUpdate.map(q => q.id).filter(Boolean) as number[];
            const questionsToDeleteIds = existingQuestionIds.filter(id => !questionsToUpdateIds.includes(id));
            
            if (questionsToDeleteIds.length > 0) {
                 await tx.submissionAnswer.deleteMany({ where: { questionId: { in: questionsToDeleteIds } } });
                 await tx.questionOption.deleteMany({ where: { questionId: { in: questionsToDeleteIds } } });
                 await tx.question.deleteMany({ where: { id: { in: questionsToDeleteIds } } });
            }

            for (const q of questionsToUpdate) {
                if (!q.id) continue;
                await tx.question.update({
                    where: { id: q.id },
                    data: { text: q.text, points: q.points, isMultipleChoice: q.isMultipleChoice }
                });
                const existingOptionIds = (await tx.questionOption.findMany({ where: { questionId: q.id }, select: { id: true }})).map(o => o.id);
                const optionsToUpdateIds = q.options.map(o => o.id).filter(Boolean) as number[];
                const optionsToDeleteIds = existingOptionIds.filter(id => !optionsToUpdateIds.includes(id));

                if (optionsToDeleteIds.length > 0) {
                    await tx.submissionAnswer.deleteMany({ where: { selectedOptionId: { in: optionsToDeleteIds } } });
                    await tx.questionOption.deleteMany({ where: { id: { in: optionsToDeleteIds }}});
                }

                for (const opt of q.options) {
                    if (opt.id) {
                        await tx.questionOption.update({ where: { id: opt.id }, data: { text: opt.text, isCorrect: opt.isCorrect }});
                    } else {
                        await tx.questionOption.create({ data: { questionId: q.id, text: opt.text, isCorrect: opt.isCorrect }});
                    }
                }
            }

            if (questionsToCreate.length > 0) {
                for (const q of questionsToCreate) {
                     await tx.question.create({
                        data: {
                            examId: examId,
                            text: q.text,
                            points: q.points,
                            isMultipleChoice: q.isMultipleChoice,
                            options: { create: q.options.map(opt => ({ text: opt.text, isCorrect: opt.isCorrect })) }
                        }
                    });
                }
            }
        });
    } else {
        await prisma.exam.create({
            data: {
                ...examData,
                questions: {
                    create: data.questions.map(q => ({
                        text: q.text,
                        points: q.points,
                        isMultipleChoice: q.isMultipleChoice,
                        options: { create: q.options.map(opt => ({ text: opt.text, isCorrect: opt.isCorrect })) },
                    })),
                },
            },
        });
    }

    revalidatePath(`/admin/exams`);
    revalidatePath(`/movies/${post.id}`);
}


export async function getExamsForAdmin() {
    const session = await auth();
    if (!session?.user) {
        throw new Error('Not authenticated');
    }
    // Add role check if necessary
    
    const exams = await prisma.exam.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            post: { select: { title: true }},
            _count: { select: { questions: true, submissions: true, pendingRequests: true } }
        }
    });

    return exams;
}


export async function getExamForEdit(examId: number) {
    const session = await auth();
    if (!session?.user) {
        throw new Error('Not authenticated');
    }
    // Add role check if necessary

    const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: {
            questions: {
                include: {
                    options: true,
                },
                orderBy: { id: 'asc' },
            },
             post: true
        },
    });

    return exam;
}

export async function deleteExam(examId: number) {
    const session = await auth();
    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        throw new Error('Not authorized');
    }

    const exam = await prisma.exam.findUnique({ where: { id: examId }});
    if (!exam) {
        throw new Error('Exam not found');
    }
    
    await prisma.$transaction(async (tx) => {
        const submissions = await tx.examSubmission.findMany({ where: { examId } });
        for (const submission of submissions) {
            await tx.submissionAnswer.deleteMany({ where: { submissionId: submission.id } });
        }
        await tx.examSubmission.deleteMany({ where: { examId } });

        const questions = await tx.question.findMany({ where: { examId } });
        for (const question of questions) {
            await tx.questionOption.deleteMany({ where: { questionId: question.id } });
        }
        await tx.question.deleteMany({ where: { examId } });

        await tx.exam.delete({ where: { id: examId } });
    });


    revalidatePath('/admin/exams');
    revalidatePath(`/movies/${exam.postId}`);
}


export async function getExamForTaker(examId: number) {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    throw new Error('You must be logged in to take an exam.');
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId, status: 'ACTIVE' },
    include: {
      post: true,
      questions: {
        include: {
          options: {
            select: { id: true, text: true }, // Don't send isCorrect to client
          },
        },
      },
    },
  });

  if (!exam) {
    return null;
  }
  
  if (exam.startDate && new Date() < exam.startDate) {
      throw new Error("This exam has not started yet.");
  }
  if (exam.endDate && new Date() > exam.endDate) {
      throw new Error("This exam has already ended.");
  }
  
    const submission = await prisma.examSubmission.findFirst({
        where: { examId: exam.id, userId: user.id }
    });

    const attemptsAllowed = exam.attemptsAllowed;
    const submissionCount = submission?.attemptCount ?? 0;

    if (attemptsAllowed > 0 && submissionCount >= attemptsAllowed) {
        throw new Error(`You have reached the maximum number of attempts (${attemptsAllowed}).`);
    }

  if (exam.post.visibility === 'GROUP_ONLY') {
      if (!exam.post.groupId) {
          throw new Error('This exam is part of a group, but the group is not specified.');
      }
      const membership = await prisma.groupMember.findFirst({
          where: { groupId: exam.post.groupId, userId: user.id, status: 'ACTIVE' }
      });
      if (!membership) {
          throw new Error('You must be a member of the associated group to take this exam.');
      }
  }


  return exam;
}


export async function submitExam(
  examId: number,
  payload: {
    answers: Record<string, string | string[]>;
    timeTakenSeconds: number;
  }
) {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { answers, timeTakenSeconds } = payload;
  
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { questions: { include: { options: true } } },
  });

  if (!exam) {
    throw new Error('Exam not found');
  }

  let score = 0;
  const answersToCreate: { questionId: number, selectedOptionId: number }[] = [];

  for (const question of exam.questions) {
    const userAnswers = answers[`question-${question.id}`];
    const correctOptions = question.options.filter(opt => opt.isCorrect);
    const correctOptionIds = correctOptions.map(opt => opt.id);

    if (question.isMultipleChoice) {
        const selectedOptionIds = (Array.isArray(userAnswers) ? userAnswers : [userAnswers]).filter(Boolean).map(id => parseInt(id, 10));
        
        let questionScore = 0;
        const pointsPerCorrectAnswer = correctOptionIds.length > 0 ? question.points / correctOptionIds.length : 0;
        
        const incorrectSelected = selectedOptionIds.some(id => !correctOptionIds.includes(id));
        
        if (incorrectSelected) {
            questionScore = 0; // If any incorrect answer is selected, score for the question is 0
        } else {
            questionScore = selectedOptionIds.length * pointsPerCorrectAnswer;
        }
        
        score += Math.max(0, Math.round(questionScore));

        selectedOptionIds.forEach(id => {
            answersToCreate.push({ questionId: question.id, selectedOptionId: id });
        });

    } else { // Single choice
        const selectedOptionId = userAnswers ? parseInt(userAnswers as string, 10) : null;

        if (selectedOptionId && correctOptionIds.includes(selectedOptionId)) {
            score += question.points;
        }
        if (selectedOptionId) {
            answersToCreate.push({ questionId: question.id, selectedOptionId: selectedOptionId });
        }
    }
  }

    const submission = await prisma.examSubmission.upsert({
        where: {
            userId_examId: {
                userId: user.id,
                examId: examId,
            }
        },
        update: {
            score,
            timeTakenSeconds,
            submittedAt: new Date(),
            attemptCount: {
                increment: 1,
            },
            answers: {
                deleteMany: {},
                create: answersToCreate
            },
        },
        create: {
            userId: user.id,
            examId: examId,
            score,
            timeTakenSeconds,
            submittedAt: new Date(),
            answers: {
                create: answersToCreate
            },
        }
    });

    return submission;
}


export async function getExamResults(submissionId: number) {
    const session = await auth();
    const user = session?.user;

    if (!user) {
        throw new Error('Not authenticated');
    }

    const submission = await prisma.examSubmission.findUnique({
        where: { id: submissionId },
        include: {
            exam: {
                include: {
                    questions: {
                        include: {
                            options: true // Get all option details for review
                        }
                    }
                }
            },
            answers: {
                select: {
                    questionId: true,
                    selectedOptionId: true,
                }
            },
            user: true, // Also include user who made the submission
        }
    });

    if (!submission) {
        throw new Error('Submission not found.');
    }
    
    if (submission.userId !== user.id && user.role !== ROLES.SUPER_ADMIN) {
        throw new Error("You are not authorized to view these results.");
    }
    
    return { submission, submissionCount: submission.attemptCount, user: submission.user };
}


export async function getExamResultsForAdmin(examId: number) {
    const session = await auth();
    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        throw new Error('Not authorized');
    }

    const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: {
            questions: {
                select: { points: true }
            }
        }
    });

    if (!exam) {
        throw new Error('Exam not found');
    }

    const submissions = await prisma.examSubmission.findMany({
        where: { examId: examId },
        select: {
            id: true,
            score: true,
            timeTakenSeconds: true,
            submittedAt: true,
            userId: true,
            examId: true,
            attemptCount: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                }
            }
        },
        orderBy: {
            score: 'desc'
        }
    });
    
    return { exam, submissions };
}

export async function updateSubmissionAttempts(submissionId: number, userId: string, attemptCount: number) {
    const session = await auth();
    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        throw new Error('Not authorized');
    }
    
    if (attemptCount < 0) {
        throw new Error('Attempts cannot be negative.');
    }
    
    await prisma.examSubmission.update({
        where: { id: submissionId },
        data: { 
            attemptCount: attemptCount,
            user: { connect: { id: userId } }
        }
    });
    
    revalidatePath(`/admin/exams/[id]/results`);
}
