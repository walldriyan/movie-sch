
'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

/**
 * Creates or updates a specific application setting in the database.
 * Only SUPER_ADMINs can perform this action.
 * @param key The unique key for the setting (e.g., 'dailyPostLimit_default').
 * @param value The value to store for the setting.
 */
export async function updateSetting(key: string, value: string) {
  const session = await auth();
  if (session?.user?.role !== ROLES.SUPER_ADMIN) {
    throw new Error('Not authorized: You do not have permission to change settings.');
  }

  const setting = await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  // Revalidate paths that might be affected by this setting change
  revalidatePath('/admin/settings');
  revalidatePath('/');
  // Add other relevant paths if needed, e.g., revalidatePath('/manage');

  return setting;
}

/**
 * Retrieves a specific application setting from the database.
 * @param key The unique key for the setting to retrieve.
 * @returns The setting object if found, otherwise null.
 */
export async function getSetting(key: string) {
  // This might be needed by various parts of the app, so we don't lock it down to admins.
  // Security through obscurity is not the goal; the enforcement of the setting is what matters.
  const setting = await prisma.appSetting.findUnique({
    where: { key },
  });

  return setting;
}
