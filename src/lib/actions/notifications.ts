
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
    type: NotificationTargetType;
    targetId?: string | null;
  }
) {
  const session = await auth();
  const user = session?.user;

  if (!user || user.role !== ROLES.SUPER_ADMIN) {
    throw new Error('Not authorized');
  }

  console.log('--- [Server Action: sendNotification] Received values ---', values);
  
  const dataToCreate = {
    title: values.title,
    message: values.message,
    type: values.type,
    targetId: values.targetId,
  };

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
