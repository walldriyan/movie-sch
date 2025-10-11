
'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';
import type { NotificationTargetType } from '@prisma/client';

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
    const notification = await prisma.notification.create({
      data: {
        title: values.title,
        message: values.message,
        targetType: values.targetType,
        targetId: values.targetId,
      },
    });
    
    // This could be used in the future to revalidate a notifications feed
    // revalidatePath('/notifications');
    
    return notification;

  } catch (error) {
    // Re-throw a more informative error for the error boundary to catch and display
    const errorMessage = `Failed to create notification. Data received: ${JSON.stringify(values, null, 2)}. Original Prisma Error: ${error instanceof Error ? error.message : String(error)}`;
    throw new Error(errorMessage);
  }
}
