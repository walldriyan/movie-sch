
'use server';

import { PrismaClient, Notification, UserNotification } from '@prisma/client';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { ROLES } from '@/lib/permissions';

const prisma = new PrismaClient();

export async function sendNotification({
  title,
  message,
  groupId,
}: {
  title: string;
  message: string;
  groupId?: number;
}) {
  const session = await auth();
  const user = session?.user;
  if (!user || user.role !== ROLES.SUPER_ADMIN) {
    throw new Error('Not authorized');
  }

  const createdDate = new Date();
  const groupIdValue = groupId ? groupId : null;

  await prisma.$executeRawUnsafe(
    `INSERT INTO "Notification" ("title", "message", "authorId", "groupId", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?)`,
    title,
    message,
    user.id,
    groupIdValue,
    createdDate,
    createdDate
  );

  const newNotification = await prisma.$queryRaw<Notification[]>`SELECT * FROM "Notification" WHERE "createdAt" = ${createdDate} AND "authorId" = ${user.id} LIMIT 1`;

  if (!newNotification || newNotification.length === 0) {
    throw new Error("Failed to create notification or retrieve it.");
  }
  const notificationId = newNotification[0].id;

  let targetUserIds: { id: string }[] = [];
  if (groupId) {
    targetUserIds = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    }).then(members => members.map(m => ({ id: m.userId })));
  } else {
    targetUserIds = await prisma.user.findMany({ select: { id: true } });
  }
  
  if (targetUserIds.length === 0) {
    return;
  }

  const userNotificationData = targetUserIds.map(user => 
    `('${user.id}', ${notificationId}, false, '${createdDate.toISOString()}', '${createdDate.toISOString()}')`
  ).join(',');

  await prisma.$executeRawUnsafe(
    `INSERT INTO "UserNotification" ("userId", "notificationId", "isRead", "createdAt", "updatedAt") VALUES ${userNotificationData}`
  );
  
  revalidatePath('/notifications');
  revalidatePath('/admin/notifications');
}

export async function getNotificationsForUser(
  { page = 1, limit = 10, isRead = false } = {}
) {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return { notifications: [], hasMore: false };
  }

  const offset = (page - 1) * limit;

  const userNotifications = await prisma.userNotification.findMany({
    where: {
      userId: user.id,
      isRead: isRead
    },
    include: {
      notification: {
        include: {
          author: true
        }
      }
    },
    orderBy: {
      notification: {
        createdAt: 'desc'
      }
    },
    take: limit,
    skip: offset
  });

  const totalCount = await prisma.userNotification.count({
    where: {
      userId: user.id,
      isRead: isRead
    }
  });

  return {
    notifications: userNotifications,
    hasMore: (offset + userNotifications.length) < totalCount,
  };
}

export async function markNotificationAsRead(userNotificationId: number) {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    throw new Error('Not authenticated');
  }

  const userNotification = await prisma.userNotification.findUnique({
    where: { id: userNotificationId },
  });

  if (userNotification?.userId !== user.id) {
    throw new Error('Not authorized to mark this notification');
  }
  
  if (userNotification.isRead) {
    return; // Already read
  }

  await prisma.userNotification.update({
    where: { id: userNotificationId },
    data: { isRead: true, updatedAt: new Date() },
  });

  revalidatePath('/notifications');
}
