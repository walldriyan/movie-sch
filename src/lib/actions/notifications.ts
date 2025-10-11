
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
    // Combine message and targetId to avoid schema change
    const messageWithTarget = values.targetId 
      ? `${values.message} (Target ID: ${values.targetId})`
      : values.message;

    const notification = await prisma.notification.create({
      data: {
        title: values.title,
        message: messageWithTarget,
        // The problematic 'targetType' field is removed from the create call
        // targetType: values.targetType, 
        // targetId is also not a valid field on its own
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
