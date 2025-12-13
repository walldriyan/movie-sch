
'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export async function generateAdKeyAction(amount: number) {
    const session = await auth();
    if (session?.user?.role !== ROLES.SUPER_ADMIN) {
        return { success: false, error: 'Unauthorized' };
    }

    // Generate specific code format: AD-XXXX-YYYY
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `AD-${randomPart}-${randomPart2}`;

    try {
        await prisma.accessKey.create({
            data: {
                code,
                type: 'AD_CAMPAIGN',
                creditAmount: amount,
                createdBy: session.user.id
            }
        });
        return { success: true, code };
    } catch (e) {
        return { success: false, error: 'Failed to generate key' };
    }
}
