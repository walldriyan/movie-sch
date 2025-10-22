
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

export async function replyToFeedback(feedbackId: string, message: string) {
    const session = await auth();
    if (session?.user?.role !== ROLES.SUPER_ADMIN) {
        throw new Error('Not authorized');
    }

    await prisma.feedbackReply.create({
        data: {
            message,
            feedbackId,
            userId: session.user.id,
        },
    });

    // Also mark the feedback as read if it was unread
    await prisma.feedback.update({
        where: { id: feedbackId },
        data: { status: 'READ' },
    });

    revalidatePath('/admin/feedback');
}
