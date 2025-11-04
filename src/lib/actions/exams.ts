

'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ROLES, MovieStatus } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { saveImageFromDataUrl } from './posts';


export async function uploadExamImage(formData: FormData): Promise<string | null> {
    console.log(`[SERVER] Step 3: 'uploadExamImage' server action initiated.`);
    const session = await auth();
    if (!session?.user) {
        throw new Error('Not authenticated');
    }
    const file = formData.get('image') as File;
    if (!file || file.size === 0) {
      return null;
    }
    const dataUrl = await file.arrayBuffer().then(buffer => 
        `data:${file.type};base64,${Buffer.from(buffer).toString('base64')}`
    );
    console.log(`[SERVER] Step 4: Calling 'saveImageFromDataUrl' to process the image data.`);
    // Save to a specific folder for exam images
    const savedUrl = await saveImageFromDataUrl(dataUrl, 'exams');
    console.log(`[SERVER] Step 4.1: 'saveImageFromDataUrl' returned:`, savedUrl);
    return savedUrl;
}


const optionSchema = z.object({
  id: z.number().optional(),
  text: z.string().min(1, 'Option text cannot be empty.'),
  isCorrect: z.boolean().default(false),
});

const imageUrlSchema = z.object({
  url: z.string().min(1, "Image URL is required."),
});


const questionSchema = z.object({
  id: z.number().optional(),
  text: z.string().min(1, 'Question text cannot be empty.'),
  points: z.coerce.number().min(1, 'Points must be at least 1.'),
  type: z.enum(['MCQ', 'IMAGE_BASED_ANSWER']).default('MCQ'),
  isMultipleChoice: z.boolean().default(false),
  options: z.array(optionSchema),
  images: z.array(imageUrlSchema),
}).superRefine((data, ctx) => {
    if (data.type === 'MCQ') {
        if (data.options.length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['options'],
                message: 'At least two options are required for an MCQ question.'
            });
        }
        if (!data.options.some(opt => opt.isCorrect)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['options'],
                message: 'At least one option must be marked as correct for an MCQ question.'
            });
        }
    } else if (data.type === 'IMAGE_BASED_ANSWER') {
        if (data.images.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['images'],
                message: 'At least one image URL is required for an image-based question.'
            });
        }
    }
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
    console.log('--- [Server Action] Received data for create/update ---', JSON.stringify(data, null, 2));
    const session = await auth();
    const user = session?.user;

    if (!user) {
        throw new Error('Not authenticated');
    }
    
    if (user.role !== ROLES.SUPER_ADMIN && data.postId) {
        const post = await prisma.post.findUnique({ where: { id: parseInt(data.postId, 10) } });
        if (post?.authorId !== user.id) {
            throw new Error('Not authorized to create or edit an exam for this post.');
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
        try {
            await prisma.$transaction(async (tx) => {
                console.log(`Updating exam ID: ${examId}`);
                
                const relationData: any = {};
                if (data.assignmentType === 'POST') {
                    relationData.post = data.postId ? { connect: { id: parseInt(data.postId, 10) } } : { disconnect: true };
                    relationData.group = { disconnect: true };
                } else if (data.assignmentType === 'GROUP') {
                    relationData.group = data.groupId ? { connect: { id: data.groupId } } : { disconnect: true };
                    relationData.post = { disconnect: true };
                }

                await tx.exam.update({
                  where: { id: examId },
                  data: {
                    ...baseExamData,
                    ...relationData
                  },
                });

                const existingQuestionIds = (await tx.question.findMany({ where: { examId }, select: { id: true }})).map(q => q.id);
                const questionsToUpdateIds = questionsToUpdate.map(q => q.id).filter(Boolean) as number[];
                const questionsToDeleteIds = existingQuestionIds.filter(id => !questionsToUpdateIds.includes(id));
                
                console.log('Questions to Delete IDs:', questionsToDeleteIds);
                if (questionsToDeleteIds.length > 0) {
                     await tx.submissionAnswer.deleteMany({ where: { questionId: { in: questionsToDeleteIds } } });
                     await tx.questionImage.deleteMany({ where: { questionId: { in: questionsToDeleteIds } } });
                     await tx.questionOption.deleteMany({ where: { questionId: { in: questionsToDeleteIds } } });
                     await tx.question.deleteMany({ where: { id: { in: questionsToDeleteIds } } });
                }

                console.log('Questions to Update:', questionsToUpdate);
                for (const q of questionsToUpdate) {
                    if (!q.id) continue;
                    console.log(`Updating question ID: ${q.id}`);

                    await tx.question.update({
                        where: { id: q.id },
                        data: { text: q.text, points: q.points, type: q.type, isMultipleChoice: q.isMultipleChoice }
                    });
                    
                    if (q.type === 'MCQ') {
                      console.log(`Processing MCQ options for question ${q.id}`);
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
                    } else if (q.type === 'IMAGE_BASED_ANSWER') {
                        console.log(`Processing Image-Based Answer images for question ${q.id}`);
                        await tx.questionImage.deleteMany({ where: { questionId: q.id } });
                        if (q.images && q.images.length > 0) {
                            await tx.questionImage.createMany({
                                data: q.images.map(img => ({ questionId: q.id!, url: img.url }))
                            });
                        }
                    }
                }

                console.log('Questions to Create:', questionsToCreate);
                if (questionsToCreate.length > 0) {
                    for (const q of questionsToCreate) {
                         console.log('Creating new question:', q.text);
                         await tx.question.create({
                            data: {
                                examId: examId,
                                text: q.text,
                                points: q.points,
                                type: q.type,
                                isMultipleChoice: q.isMultipleChoice,
                                options: q.type === 'MCQ' ? { create: q.options.map(opt => ({ text: opt.text, isCorrect: opt.isCorrect })) } : undefined,
                                images: q.type === 'IMAGE_BASED_ANSWER' && q.images ? { create: q.images.map(img => ({ url: img.url })) } : undefined,
                            }
                        });
                    }
                }
            });
        } catch (e: any) {
            console.error("Transaction failed:", e);
            throw e;
        }
    } else { // Create a new exam
        console.log("Creating new exam");
        const createData: Prisma.ExamCreateInput = {
            ...baseExamData,
            post: data.assignmentType === 'POST' && data.postId ? { connect: { id: parseInt(data.postId, 10) } } : undefined,
            group: data.assignmentType === 'GROUP' && data.groupId ? { connect: { id: data.groupId } } : undefined,
            questions: {
                create: data.questions.map(q => ({
                    text: q.text,
                    points: q.points,
                    isMultipleChoice: q.isMultipleChoice,
                    type: q.type,
                    options: q.type === 'MCQ' ? { create: q.options.map(opt => ({ text: opt.text, isCorrect: opt.isCorrect })) } : undefined,
                    images: q.type === 'IMAGE_BASED_ANSWER' && q.images ? { create: q.images.map(img => ({ url: img.url })) } : undefined,
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
                    images: true
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

    const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { post: true } });
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
            await tx.questionImage.deleteMany({ where: { questionId: question.id } });
        }
        await tx.question.deleteMany({ where: { examId } });

        await tx.exam.delete({ where: { id: examId } });

        if (exam.post?.title === '__internal_group_exams_placeholder__') {
            await tx.post.delete({ where: { id: exam.postId! } });
        }
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
          images: true,
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
  
    const submissions = await prisma.examSubmission.findMany({
        where: { userId: user.id, examId: exam.id }
    });

    const attemptsAllowed = exam.attemptsAllowed;
    const submissionCount = submissions.length;

    if (attemptsAllowed > 0 && submissionCount >= attemptsAllowed) {
        throw new Error(`You have reached the maximum number of attempts (${attemptsAllowed}).`);
    }

  let hasAccess = false;
  
  if (exam.groupId) { // If it's a group exam, membership is required
      const membership = await prisma.groupMember.findFirst({
          where: { groupId: exam.groupId, userId: user.id, status: 'ACTIVE' }
      });
      if (membership) {
          hasAccess = true;
      }
  } else if (exam.postId && exam.post) { // Regular post-based access
      if (exam.post.visibility === 'PUBLIC') {
          hasAccess = true;
      }
  } else if (!exam.groupId && !exam.postId) {
      // Should not happen with proper schema, but as a fallback for old data
      hasAccess = user.role === ROLES.SUPER_ADMIN;
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
  const userId = user.id;

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

  let score = 0;
  const answersForDb: Omit<Prisma.SubmissionAnswerCreateManyInput, 'submissionId'>[] = [];

  for (const question of exam.questions) {
      const answerPayload = answers[`question-${question.id}`];

      if (question.type === 'MCQ') {
          const userAnswers = (Array.isArray(answerPayload) ? answerPayload : [answerPayload]).filter(Boolean);
          const correctOptionIds = question.options.filter(opt => opt.isCorrect).map(opt => opt.id);
          
          if (userAnswers.length > 0) {
              const selectedOptionIds = userAnswers.map(id => parseInt(id, 10));
              
              selectedOptionIds.forEach(id => {
                  answersForDb.push({ questionId: question.id, selectedOptionId: id });
              });

              if (question.isMultipleChoice) {
                  let questionScore = 0;
                  const pointsPerCorrectAnswer = correctOptionIds.length > 0 ? question.points / correctOptionIds.length : 0;
                  const incorrectSelected = selectedOptionIds.some(id => !correctOptionIds.includes(id));
                  
                  if (!incorrectSelected) {
                      questionScore = selectedOptionIds.length * pointsPerCorrectAnswer;
                  }
                  score += Math.max(0, Math.round(questionScore));
              } else {
                  if (correctOptionIds.includes(selectedOptionIds[0])) {
                      score += question.points;
                  }
              }
          }
      } else if (question.type === 'IMAGE_BASED_ANSWER') {
          if (typeof answerPayload === 'string' && answerPayload) {
              answersForDb.push({ questionId: question.id, customAnswer: answerPayload });
          }
      }
  }

  const previousSubmissions = await prisma.examSubmission.count({
    where: { userId, examId },
  });
  const currentAttempt = previousSubmissions + 1;

  const newSubmission = await prisma.examSubmission.create({
    data: {
      userId,
      examId,
      score,
      timeTakenSeconds,
      attemptCount: currentAttempt,
      answers: {
        create: answersForDb,
      },
    },
  });

  const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);
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

  revalidatePath('/profile/' + user.id);
  return newSubmission;
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
                            options: true, // Get all option details for review
                            images: true, // Get images for image-based questions
                        }
                    }
                }
            },
            answers: true,
            user: true, // Also include user who made the submission
        }
    });

    if (!submission) {
        throw new Error('Submission not found.');
    }
    
    if (submission.userId !== user.id && user.role !== ROLES.SUPER_ADMIN) {
        throw new Error("You are not authorized to view these results.");
    }
    
    // We don't have attemptHistory anymore, so we fetch all submissions for this exam/user
    const allSubmissionsForExam = await prisma.examSubmission.findMany({
        where: {
            userId: submission.userId,
            examId: submission.examId,
        },
        orderBy: {
            submittedAt: 'desc'
        }
    });
    
    return { submission, allSubmissions: allSubmissionsForExam, submissionCount: allSubmissionsForExam.length, user: submission.user };
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
            },
            answers: true
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

    const submission = await prisma.examSubmission.findUnique({ where: { id: submissionId }});
    if (!submission) {
        throw new Error('Submission not found');
    }
    
    await prisma.examSubmission.updateMany({
        where: { 
          userId: userId,
          examId: submission.examId,
        },
        data: { 
            attemptCount: attemptCount,
        }
    });
    
    revalidatePath(`/admin/exams/${submission.examId}/results`);
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
            group: {
                select: {
                    name: true
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

export async function gradeCustomAnswer(submissionId: number, questionId: number, marksAwarded: number) {
    const session = await auth();
    const user = session?.user;
    if (!user || user.role !== ROLES.SUPER_ADMIN) {
        throw new Error('Not authorized');
    }
    
    const submissionAnswer = await prisma.submissionAnswer.findFirst({
        where: { submissionId, questionId },
        include: { question: true }
    });

    if (!submissionAnswer) {
        throw new Error("Answer not found.");
    }
    
    if (marksAwarded < 0 || marksAwarded > submissionAnswer.question.points) {
        throw new Error(`Marks must be between 0 and ${submissionAnswer.question.points}.`);
    }
    
    await prisma.submissionAnswer.update({
        where: { id: submissionAnswer.id },
        data: { marksAwarded },
    });
    
    // Recalculate total score
    const submission = await prisma.examSubmission.findUnique({
        where: { id: submissionId },
        include: {
            answers: {
                include: {
                    question: { include: { options: true } },
                },
            },
        },
    });

    if (!submission) {
        throw new Error("Submission not found during score recalculation.");
    }
    
    let newTotalScore = 0;
    const processedMcqQuestions = new Set<number>();

    for (const answer of submission.answers) {
        if (answer.question.type === 'MCQ' && !processedMcqQuestions.has(answer.questionId)) {
            const correctOptionIds = answer.question.options.filter(o => o.isCorrect).map(o => o.id);
            const userAnswersForQuestion = submission.answers
                .filter(a => a.questionId === answer.questionId)
                .map(a => a.selectedOptionId);

            if (answer.question.isMultipleChoice) {
                const pointsPerCorrectAnswer = correctOptionIds.length > 0 ? answer.question.points / correctOptionIds.length : 0;
                let questionScore = 0;
                const incorrectSelected = userAnswersForQuestion.some(id => id && !correctOptionIds.includes(id));
                
                if (!incorrectSelected) {
                    const correctSelectedCount = userAnswersForQuestion.filter(id => id && correctOptionIds.includes(id)).length;
                    questionScore = correctSelectedCount * pointsPerCorrectAnswer;
                }
                newTotalScore += Math.max(0, Math.round(questionScore));

            } else {
                if (userAnswersForQuestion[0] && correctOptionIds.includes(userAnswersForQuestion[0])) {
                    newTotalScore += answer.question.points;
                }
            }
            processedMcqQuestions.add(answer.questionId);
        } else if (answer.question.type === 'IMAGE_BASED_ANSWER') {
            // Use the newly awarded marks if this is the question being graded
            if (answer.questionId === questionId) {
                newTotalScore += marksAwarded;
            } else if (answer.marksAwarded !== null) { // Use previously awarded marks for other custom questions
                newTotalScore += answer.marksAwarded;
            }
        }
    }
    
    await prisma.examSubmission.update({
        where: { id: submissionId },
        data: { score: newTotalScore },
    });

    revalidatePath(`/admin/exams/${submission.examId}/results`);
    revalidatePath(`/profile/${submission.userId}`);

    return { success: true, newTotalScore };
}

    


