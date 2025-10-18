

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
  assignmentType: z.enum(['POST', 'GROUP']).default('POST'),
  postId: z.string().optional(),
  groupId: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).default('DRAFT'),
  durationMinutes: z.coerce.number().optional().nullable(),
  attemptsAllowed: z.coerce.number().min(0, 'Attempts must be 0 or more. 0 for unlimited.').default(1),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  questions: z.array(questionSchema).min(1, 'At least one question is required.'),
}).superRefine((data, ctx) => {
    if (data.assignmentType === 'POST' && !data.postId) {
        ctx.addIssue({
            code: 'custom',
            path: ['postId'],
            message: 'A post must be selected when assigning to a post.',
        });
    }
    if (data.assignmentType === 'GROUP' && !data.groupId) {
        ctx.addIssue({
            code: 'custom',
            path: ['groupId'],
            message: 'A group must be selected when assigning to a group.',
        });
    }
});


type ExamFormData = z.infer<typeof examSchema>;

export async function createOrUpdateExam(data: ExamFormData, examId?: number | null) {
    const session = await auth();
    const user = session?.user;

    if (!user) {
        throw new Error('Not authenticated');
    }
    
    // Authorization logic
    if (user.role !== ROLES.SUPER_ADMIN) {
        let isAuthorized = false;
        if (data.assignmentType === 'POST' && data.postId) {
            const post = await prisma.post.findUnique({ where: { id: parseInt(data.postId, 10) } });
            if (post?.authorId === user.id) isAuthorized = true;
        } else if (data.assignmentType === 'GROUP' && data.groupId) {
            const group = await prisma.group.findUnique({ where: { id: data.groupId } });
            if (group?.createdById === user.id) isAuthorized = true;
        }
        if (!isAuthorized) {
            throw new Error('Not authorized to create or edit an exam for this item.');
        }
    }
    
    const baseExamData = {
        title: data.title,
        description: data.description,
        status: data.status,
        durationMinutes: data.durationMinutes,
        attemptsAllowed: data.attemptsAllowed,
        startDate: data.startDate,
        endDate: data.endDate,
    };
    
    const questionsToCreate = data.questions.filter(q => !q.id);
    const questionsToUpdate = data.questions.filter(q => q.id);

    if (examId) { // Update an existing exam
        await prisma.$transaction(async (tx) => {
            const relationData: any = {};
            if (data.assignmentType === 'POST' && data.postId) {
                relationData.post = { connect: { id: parseInt(data.postId, 10) } };
                relationData.group = { disconnect: true };
            } else if (data.assignmentType === 'GROUP' && data.groupId) {
                relationData.group = { connect: { id: data.groupId } };
                relationData.post = { disconnect: true };
            }

            await tx.exam.update({
              where: { id: examId },
              data: {
                ...baseExamData,
                ...relationData,
              },
            });

            // Logic to update questions and options remains the same...
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
    } else { // Create a new exam
        const createData: Prisma.ExamCreateInput = {
            ...baseExamData,
            post: data.assignmentType === 'POST' && data.postId ? { connect: { id: parseInt(data.postId, 10) } } : undefined,
            group: data.assignmentType === 'GROUP' && data.groupId ? { connect: { id: data.groupId } } : undefined,
            questions: {
                create: data.questions.map(q => ({
                    text: q.text,
                    points: q.points,
                    isMultipleChoice: q.isMultipleChoice,
                    options: { create: q.options.map(opt => ({ text: opt.text, isCorrect: opt.isCorrect })) },
                })),
            },
        };

        await prisma.exam.create({ data: createData });
    }

    revalidatePath(`/admin/exams`);
    if (data.postId) {
        revalidatePath(`/movies/${data.postId}`);
    }
}


export async function getExamsForAdmin() {
    const session = await auth();
    if (!session?.user) {
        throw new Error('Not authenticated');
    }
    
    const exams = await prisma.exam.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            post: { select: { title: true, groupId: true }},
            group: { select: { name: true }},
            _count: { select: { questions: true, submissions: true } }
        }
    });

    return exams.map(exam => ({
        ...exam,
        _count: {
            ...exam._count,
            pendingRequests: 0, // Placeholder
        }
    }));
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
             post: true,
             group: true
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
    if (exam.postId) {
        revalidatePath(`/movies/${exam.postId}`);
    }
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
      group: true,
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

  let hasAccess = false;
  if (exam.postId && exam.post) {
      if (exam.post.visibility === 'PUBLIC') {
          hasAccess = true;
      } else if (exam.post.groupId) {
          const membership = await prisma.groupMember.findFirst({
              where: { groupId: exam.post.groupId, userId: user.id, status: 'ACTIVE' }
          });
          if (membership) {
              hasAccess = true;
          }
      }
  } else if (exam.groupId) {
      const membership = await prisma.groupMember.findFirst({
          where: { groupId: exam.groupId, userId: user.id, status: 'ACTIVE' }
      });
      if (membership) {
          hasAccess = true;
      }
  }

  if (!hasAccess) {
       throw new Error('You do not have permission to access this exam.');
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
    include: { 
        questions: { include: { options: true } },
        post: { select: { seriesId: true, orderInSeries: true }}
    },
  });

  if (!exam) {
    throw new Error('Exam not found');
  }

  let totalPoints = 0;
  let score = 0;
  const answersToCreate: { questionId: number, selectedOptionId: number }[] = [];

  for (const question of exam.questions) {
    totalPoints += question.points;
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

  // Check if exam is passed and unlock next post
  const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
  if (percentage >= 50 && exam.post?.seriesId && exam.post.orderInSeries) {
    const nextPostInSeries = await prisma.post.findFirst({
      where: {
        seriesId: exam.post.seriesId,
        orderInSeries: exam.post.orderInSeries + 1,
      },
    });

    if (nextPostInSeries) {
      await prisma.post.update({
        where: { id: nextPostInSeries.id },
        data: { isLockedByDefault: false },
      });
      revalidatePath(`/series/${exam.post.seriesId}`);
    }
  }

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
        }
    });
    
    revalidatePath(`/admin/exams/[id]/results`);
}


export async function getExamsForUser(userId: string) {
    const session = await auth();
    const user = session?.user;

    // A user can only view their own exams list unless they are a super admin
    if (!user || (user.id !== userId && user.role !== ROLES.SUPER_ADMIN)) {
        throw new Error("Not authorized");
    }

    const userGroupIds = await prisma.groupMember.findMany({
        where: { userId: userId, status: 'ACTIVE' },
        select: { groupId: true },
    }).then(members => members.map(m => m.groupId));

    const exams = await prisma.exam.findMany({
        where: {
            status: 'ACTIVE',
            OR: [
                { // Exams associated with posts the user can see
                    post: {
                        OR: [
                            { visibility: 'PUBLIC' },
                            {
                                visibility: 'GROUP_ONLY',
                                groupId: { in: userGroupIds }
                            }
                        ]
                    }
                },
                { // Exams associated directly with groups the user is in
                   groupId: { in: userGroupIds }
                }
            ]
        },
        include: {
            post: {
                select: {
                    title: true
                }
            },
            _count: {
                select: {
                    questions: true
                }
            },
            questions: {
                select: {
                    points: true
                }
            },
            submissions: {
                where: { userId: userId },
                orderBy: { submittedAt: 'desc' },
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return exams;
}

