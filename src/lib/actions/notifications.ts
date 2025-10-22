'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';
import type { Notification, NotificationStatus, NotificationType } from '@prisma/client';

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

  // console.log('--- [Server Action: sendNotification] Received values ---', values);

  let targetUserIds: string[] = [];

  if (values.type === 'USER' && values.targetId) {
    targetUserIds.push(values.targetId);
  } else if (values.type === 'GROUP' && values.targetId) {
    const members = await prisma.groupMember.findMany({
      where: { groupId: values.targetId, status: 'ACTIVE' },
      select: { userId: true },
    });
    targetUserIds = members.map(m => m.userId);
  } else if (values.type === 'PUBLIC') {
    const allUsers = await prisma.user.findMany({
      select: { id: true },
    });
    targetUserIds = allUsers.map(u => u.id);
  }

  if (targetUserIds.length === 0 && values.type !== 'PUBLIC') {
    // Don't create a notification if there are no targets, unless it's a public one with no users in db yet
    // console.log("No target users found for this notification. Aborting.");
    return null;
  }

  const dataForNotification = {
    title: values.title,
    message: values.message,
    type: 'CUSTOM' as NotificationType, // Using a valid enum from the schema
    senderId: user.id,
    users: {
      create: targetUserIds.map(userId => ({
        userId: userId,
        status: 'UNREAD' as NotificationStatus,
      })),
    },
  };

  // console.log('--- [Server Action: sendNotification] Data for prisma.notification.create ---', JSON.stringify(dataForNotification, null, 2));

  const notification = await prisma.notification.create({
    data: dataForNotification,
  });

  revalidatePath('/');

  return notification;
}

export async function getNotifications(): Promise<Notification[]> {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return [];
  }

  const userNotifications = await prisma.userNotification.findMany({
    where: { userId: user.id },
    include: {
      notification: true,
    },
    orderBy: {
      notification: {
        createdAt: 'desc',
      },
    },
  });

  return userNotifications.map(un => ({
    ...un.notification,
    // Override notification status with user-specific status
    status: un.status, 
    id: un.notificationId, // Use notification ID
    createdAt: un.notification.createdAt.toISOString(),
    updatedAt: un.notification.updatedAt.toISOString(),
  })) as unknown as Notification[];
}

export async function updateNotificationStatus(notificationId: string, status: NotificationStatus): Promise<UserNotification | null> {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Not authenticated");
    }
    const userId = session.user.id;

    const userNotification = await prisma.userNotification.findUnique({
      where: { userId_notificationId: { userId, notificationId } },
    });

    if (!userNotification) {
      // This might happen if a notification is created for a user who then logs out
      // or if the notification is deleted before they can mark it as read.
      console.warn(`UserNotification record not found for userId: ${userId} and notificationId: ${notificationId}`);
      return null;
    }

    const updatedUserNotification = await prisma.userNotification.update({
        where: { userId_notificationId: { userId, notificationId } },
        data: { status },
    });
    revalidatePath('/');
    return updatedUserNotification;
}
