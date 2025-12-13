
'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/permissions';
import { saveImageFromDataUrl, deleteUploadedFile } from './posts';
import type { FeedbackStatus } from '@prisma/client';

export async function submitFeedback(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Not authenticated');
    }

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const imageFile = formData.get('image') as File | null;

    if (!title || !description) {
        throw new Error('Title and description are required.');
    }

    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
        const dataUrl = await imageFile.arrayBuffer().then(buffer =>
            `data:${imageFile.type};base64,${Buffer.from(buffer).toString('base64')}`
        );
        imageUrl = await saveImageFromDataUrl(dataUrl, 'feedback');
    }

    await prisma.feedback.create({
        data: {
            title,
            description,
            imageUrl,
            userId: session.user.id,
        },
    });

    revalidatePath('/feedback');
    revalidatePath('/admin/feedback');
}

export async function getFeedbackForAdmin() {
    const session = await auth();
    if (session?.user?.role !== ROLES.SUPER_ADMIN) {
        throw new Error('Not authorized');
    }

    return prisma.feedback.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
            },
            replies: {
                orderBy: { createdAt: 'asc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        }
                    }
                }
            }
        },
    });
}

export async function updateFeedbackStatus(feedbackId: string, status: FeedbackStatus) {
    const session = await auth();
    if (session?.user?.role !== ROLES.SUPER_ADMIN) {
        throw new Error('Not authorized');
    }

    await prisma.feedback.update({
        where: { id: feedbackId },
        data: { status },
    });

    revalidatePath('/admin/feedback');
}


export async function getFeedbackForUser(userId: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.id !== userId) {
        return { success: false, error: 'Not authorized' };
    }

    try {
        const feedbacks = await prisma.feedback.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                replies: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        user: true
                    }
                }
            }
        });
        return { success: true, data: feedbacks };
    } catch (e) {
        return { success: false, error: 'Failed to fetch messages' };
    }
}

export async function createFeedback(title: string, description: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        await prisma.feedback.create({
            data: {
                title,
                description,
                userId: session.user.id,
            },
        });
        revalidatePath(`/profile/${session.user.id}`);
        return { success: true };
    } catch (e) {
        return { success: false, error: 'Failed to create message' };
    }
}

export async function replyToFeedback(feedbackId: string, message: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Not authenticated');
    }

    // Check if user is admin OR owner of the feedback
    const feedback = await prisma.feedback.findUnique({ where: { id: feedbackId } });
    if (!feedback) {
        throw new Error('Feedback not found');
    }

    const isOwner = feedback.userId === session.user.id;
    const isAdmin = session.user.role === ROLES.SUPER_ADMIN;

    if (!isOwner && !isAdmin) {
        throw new Error('Not authorized');
    }

    await prisma.feedbackReply.create({
        data: {
            message,
            feedbackId,
            userId: session.user.id,
        },
    });

    // If admin replying, mark as READ or CLOSED? Maybe just READ.
    // If user replying, maybe mark as UNREAD again so admin sees it?
    if (isAdmin) {
        await prisma.feedback.update({
            where: { id: feedbackId },
            data: { status: 'READ' },
        });
    } else {
        await prisma.feedback.update({
            where: { id: feedbackId },
            data: { status: 'UNREAD' }, // Re-open for admin attention
        });
    }

    revalidatePath('/admin/feedback');
    revalidatePath(`/profile/${feedback.userId}`);
}

