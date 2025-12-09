

'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ROLES, MovieStatus } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { saveImageFromDataUrl } from './posts';


export async function uploadExamImage(formData: FormData): Promise<string | null> {
    console.log(`[SERVER: STEP 5.1] 'uploadExamImage' server action initiated.`);
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
    console.log(`[SERVER: STEP 5.2] Calling 'saveImageFromDataUrl' to process the image data.`);
    const savedUrl = await saveImageFromDataUrl(dataUrl, 'exams');
    console.log(`[SERVER: STEP 5.3] 'saveImageFromDataUrl' returned URL:`, savedUrl);
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
    images: z.array(imageUrlSchema).optional().default([]),
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
        if (!data.images || data.images.length === 0) {
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
    console.log('[SERVER: STEP 5] createOrUpdateExam action started. Received data:', JSON.stringify(data, null, 2));
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
            // Optimized transaction to stay within Prisma Accelerate's 15s timeout
            await prisma.$transaction(async (tx) => {
                console.log(`[SERVER] Updating exam ID: ${examId}`);

                const relationData: any = {};
                if (data.assignmentType === 'POST') {
                    relationData.post = data.postId ? { connect: { id: parseInt(data.postId, 10) } } : { disconnect: true };
                    relationData.group = { disconnect: true };
                } else if (data.assignmentType === 'GROUP') {
                    relationData.group = data.groupId ? { connect: { id: data.groupId } } : { disconnect: true };
                    relationData.post = { disconnect: true };
                }

                // Update exam metadata
                await tx.exam.update({
                    where: { id: examId },
                    data: {
                        ...baseExamData,
                        ...relationData
                    },
                });

                // Fetch all existing questions and their options in one go
                const existingQuestions = await tx.question.findMany({
                    where: { examId },
                    select: { id: true },
                });
                const existingQuestionIds = existingQuestions.map(q => q.id);
                const questionsToUpdateIds = questionsToUpdate.map(q => q.id).filter(Boolean) as number[];
                const questionsToDeleteIds = existingQuestionIds.filter(id => !questionsToUpdateIds.includes(id));

                // Batch delete questions that are no longer needed
                if (questionsToDeleteIds.length > 0) {
                    console.log('[SERVER] Deleting questions:', questionsToDeleteIds);
                    await tx.submissionAnswer.deleteMany({ where: { questionId: { in: questionsToDeleteIds } } });
                    await tx.questionImage.deleteMany({ where: { questionId: { in: questionsToDeleteIds } } });
                    await tx.questionOption.deleteMany({ where: { questionId: { in: questionsToDeleteIds } } });
                    await tx.question.deleteMany({ where: { id: { in: questionsToDeleteIds } } });
                }

                // Fetch all existing options for questions being updated (single query)
                const existingOptions = questionsToUpdateIds.length > 0
                    ? await tx.questionOption.findMany({
                        where: { questionId: { in: questionsToUpdateIds } },
                        select: { id: true, questionId: true }
                    })
                    : [];

                // Group existing options by questionId for quick lookup
                const optionsByQuestionId = new Map<number, number[]>();
                existingOptions.forEach(opt => {
                    if (!optionsByQuestionId.has(opt.questionId)) {
                        optionsByQuestionId.set(opt.questionId, []);
                    }
                    optionsByQuestionId.get(opt.questionId)!.push(opt.id);
                });

                // Prepare batch operations
                const optionsToDelete: number[] = [];
                const optionsToCreate: Array<{ questionId: number, text: string, isCorrect: boolean }> = [];
                const optionsToUpdatePromises: Promise<any>[] = [];
                const imagesToDelete: number[] = [];
                const imagesToCreate: Array<{ questionId: number, url: string }> = [];

                // Update questions and prepare option/image operations
                console.log('[SERVER] Processing questions to update:', questionsToUpdate.length);
                for (const q of questionsToUpdate) {
                    if (!q.id) continue;

                    // Update question
                    await tx.question.update({
                        where: { id: q.id },
                        data: { text: q.text, points: q.points, type: q.type, isMultipleChoice: q.isMultipleChoice }
                    });

                    if (q.type === 'MCQ') {
                        const existingOptionIds = optionsByQuestionId.get(q.id) || [];
                        const optionsToUpdateIds = q.options.map(o => o.id).filter(Boolean) as number[];
                        const optionsToDeleteForQuestion = existingOptionIds.filter(id => !optionsToUpdateIds.includes(id));

                        // Collect options to delete
                        optionsToDelete.push(...optionsToDeleteForQuestion);

                        // Process each option
                        for (const opt of q.options) {
                            if (opt.id) {
                                // Update existing option
                                optionsToUpdatePromises.push(
                                    tx.questionOption.update({
                                        where: { id: opt.id },
                                        data: { text: opt.text, isCorrect: opt.isCorrect }
                                    })
                                );
                            } else {
                                // Collect new options to create
                                optionsToCreate.push({
                                    questionId: q.id,
                                    text: opt.text,
                                    isCorrect: opt.isCorrect
                                });
                            }
                        }
                    } else if (q.type === 'IMAGE_BASED_ANSWER') {
                        // Mark all images for this question for deletion
                        imagesToDelete.push(q.id);

                        // Collect new images to create
                        if (q.images && q.images.length > 0) {
                            imagesToCreate.push(...q.images.map(img => ({
                                questionId: q.id!,
                                url: img.url
                            })));
                        }
                    }
                }

                // Execute batch operations
                if (optionsToDelete.length > 0) {
                    console.log('[SERVER] Deleting options:', optionsToDelete.length);
                    await tx.submissionAnswer.deleteMany({ where: { selectedOptionId: { in: optionsToDelete } } });
                    await tx.questionOption.deleteMany({ where: { id: { in: optionsToDelete } } });
                }

                if (optionsToUpdatePromises.length > 0) {
                    console.log('[SERVER] Updating options:', optionsToUpdatePromises.length);
                    await Promise.all(optionsToUpdatePromises);
                }

                if (optionsToCreate.length > 0) {
                    console.log('[SERVER] Creating options:', optionsToCreate.length);
                    await tx.questionOption.createMany({ data: optionsToCreate });
                }

                if (imagesToDelete.length > 0) {
                    console.log('[SERVER] Deleting images for questions:', imagesToDelete.length);
                    await tx.questionImage.deleteMany({ where: { questionId: { in: imagesToDelete } } });
                }

                if (imagesToCreate.length > 0) {
                    console.log('[SERVER] Creating images:', imagesToCreate.length);
                    await tx.questionImage.createMany({ data: imagesToCreate });
                }

                // Create new questions with their options/images
                if (questionsToCreate.length > 0) {
                    console.log('[SERVER] Creating new questions:', questionsToCreate.length);
                    for (const q of questionsToCreate) {
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
            }, {
                maxWait: 10000, // Maximum wait time to acquire a connection
                timeout: 15000, // Maximum timeout allowed by Prisma Accelerate
            });
        } catch (e: any) {
            console.error("[SERVER ERROR] Transaction failed:", e);
            throw e;
        }
    } else { // Create a new exam
        console.log("[SERVER] Creating new exam");
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
            post: { select: { title: true, groupId: true } },
            group: { select: { name: true } },
            _count: { select: { questions: true, submissions: true } }
        }
    });

    return exams.map((exam: any) => ({
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
        // Get all question IDs for this exam
        const questionIds = await tx.question.findMany({
            where: { examId },
            select: { id: true }
        }).then(qs => qs.map(q => q.id));

        // Batch delete all related data
        if (questionIds.length > 0) {
            // Delete submission answers for all questions
            await tx.submissionAnswer.deleteMany({
                where: { questionId: { in: questionIds } }
            });

            // Delete question options and images
            await tx.questionOption.deleteMany({
                where: { questionId: { in: questionIds } }
            });
            await tx.questionImage.deleteMany({
                where: { questionId: { in: questionIds } }
            });
        }

        // Delete all submissions for this exam
        await tx.examSubmission.deleteMany({ where: { examId } });

        // Delete all questions for this exam
        await tx.question.deleteMany({ where: { examId } });

        // Delete the exam
        await tx.exam.delete({ where: { id: examId } });

        // Clean up placeholder post if it exists
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
    } else if (exam.postId && (exam as any).post) { // Regular post-based access
        if ((exam as any).post.visibility === 'PUBLIC') {
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
            post: { select: { seriesId: true, orderInSeries: true } }
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
            submittedAt: 'desc'
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

    const submission = await prisma.examSubmission.findUnique({ where: { id: submissionId } });
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

    // Get user's active group IDs in a single query
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
        select: {
            id: true,
            title: true,
            description: true,
            durationMinutes: true,
            attemptsAllowed: true,
            startDate: true,
            endDate: true,
            createdAt: true,
            post: {
                select: {
                    id: true,
                    title: true
                }
            },
            group: {
                select: {
                    id: true,
                    name: true
                }
            },
            _count: {
                select: {
                    questions: true
                }
            },
            // Only get total points, not all question data
            questions: {
                select: {
                    points: true
                }
            },
            // Only get the latest submission and count
            submissions: {
                where: { userId: userId },
                orderBy: { submittedAt: 'desc' },
                select: {
                    id: true,
                    score: true,
                    submittedAt: true,
                    attemptCount: true,
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Calculate total points from questions
    return exams.map((exam: any) => ({
        ...exam,
        totalPoints: exam.questions.reduce((sum: number, q: any) => sum + q.points, 0),
        submissionCount: exam.submissions.length > 0 ? exam.submissions[0].attemptCount : 0,
        latestSubmission: exam.submissions[0] || null,
    }));
}

export async function gradeCustomAnswer(submissionId: number, questionId: number, marksAwarded: number) {
    const session = await auth();
    const user = session?.user;
    if (!user || user.role !== ROLES.SUPER_ADMIN) {
        throw new Error('Not authorized');
    }

    let submissionAnswer = await prisma.submissionAnswer.findFirst({
        where: { submissionId, questionId },
        include: { question: true }
    });

    // If answer doesn't exist, create it (Admin grading an empty/missing answer)
    if (!submissionAnswer) {
        const question = await prisma.question.findUnique({ where: { id: questionId } });
        if (!question) throw new Error("Question not found.");

        if (marksAwarded < 0 || marksAwarded > question.points) {
            throw new Error(`Marks must be between 0 and ${question.points}.`);
        }

        submissionAnswer = await prisma.submissionAnswer.create({
            data: {
                submissionId,
                questionId,
                marksAwarded,
                customAnswer: "", // Empty answer created by admin grading
            },
            include: { question: true }
        });
    } else {
        if (marksAwarded < 0 || marksAwarded > submissionAnswer.question.points) {
            throw new Error(`Marks must be between 0 and ${submissionAnswer.question.points}.`);
        }

        await prisma.submissionAnswer.update({
            where: { id: submissionAnswer.id },
            data: { marksAwarded },
        });
    }

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
