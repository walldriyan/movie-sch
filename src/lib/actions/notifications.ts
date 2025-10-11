
'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';
import type { NotificationTargetType, Notification, NotificationStatus } from '@prisma/client';

export async function sendNotification(
  values: {
    title: string;
    message: string;
    targetType: NotificationTargetType;
    targetId?: string | null;
  }
) {
  const session = await auth();
  const user = session?.user;

  if (!user || user.role !== ROLES.SUPER_ADMIN) {
    throw new Error('Not authorized');
  }

  try {
    // Combine message and targetId to avoid schema change
    const messageWithTarget = values.targetId 
      ? `${values.message} (Target ID: ${values.targetId})`
      : values.message;

    const notification = await prisma.notification.create({
      data: {
        title: values.title,
        message: messageWithTarget,
      },
    });
    
    revalidatePath('/');
    
    return notification;

  } catch (error) {
    const errorMessage = `Failed to create notification. Data received: ${JSON.stringify(values, null, 2)}. Original Prisma Error: ${error instanceof Error ? error.message : String(error)}`;
    throw new Error(errorMessage);
  }
}

export async function getNotifications(): Promise<Notification[]> {
    return prisma.notification.findMany({
        orderBy: {
            createdAt: 'desc',
        },
    });
}

export async function updateNotificationStatus(notificationId: string, status: NotificationStatus): Promise<Notification> {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Not authenticated");
    }
    const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: { status },
    });
    revalidatePath('/');
    return updatedNotification;
}
