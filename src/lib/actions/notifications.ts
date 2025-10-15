
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
    type: 'PUBLIC' | 'USER' | 'GROUP';
    targetId?: string | null;
  }
) {
  const session = await auth();
  const user = session?.user;

  if (!user || user.role !== ROLES.SUPER_ADMIN) {
    throw new Error('Not authorized');
  }

  // --- [Server Action: Debug Log] Received values from client ---
  console.log('--- [Server Action: sendNotification] Received values ---', values);
  
  // CRITICAL FIX: Map the client-side 'PUBLIC' type to a valid Prisma enum value.
  // We will use 'USER' type with a null targetId to represent a public broadcast.
  // This ensures we are always sending a value that exists in the `NotificationTargetType` enum.
  const prismaType: NotificationTargetType = values.type === 'PUBLIC' ? 'USER' : values.type;

  const dataToCreate = {
    title: values.title,
    message: values.message,
    type: prismaType,
    // When it's a public message, the targetId from client is null/undefined,
    // and we ensure it is null here.
    targetId: values.type === 'PUBLIC' ? null : values.targetId,
  };

  // --- [Server Action: Debug Log] Data being sent to Prisma ---
  console.log('--- [Server Action: sendNotification] Data for prisma.notification.create ---', dataToCreate);

  const notification = await prisma.notification.create({
    data: dataToCreate,
  });
  
  revalidatePath('/');
  
  return notification;
}

export async function getNotifications(): Promise<Notification[]> {
    const notifications = await prisma.notification.findMany({
        orderBy: {
            createdAt: 'desc',
        },
    });
    return notifications.map(n => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })) as unknown as Notification[];
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
