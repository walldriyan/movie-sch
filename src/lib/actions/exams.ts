
'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { z } from 'zod';

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
    // Assuming USER_ADMIN can also create/edit exams for any post, or we can restrict it to their own posts
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
                await tx.submissionAnswer.deleteMany({ where: { questionId: q.id }});
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
