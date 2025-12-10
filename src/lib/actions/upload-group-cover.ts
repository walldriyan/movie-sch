'use server';

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import prisma from '@/lib/prisma'; // Assuming you have this

export async function uploadGroupCover(groupId: string, formData: FormData) {
    try {
        const session = await auth();
        const user = session?.user;

        // Basic permission check
        if (!user) {
            throw new Error("Unauthorized");
        }

        // Verify user is super admin or group creator
        if (user.role !== ROLES.SUPER_ADMIN) {
            const group = await prisma.group.findUnique({ where: { id: groupId } }); // Helper check
            if (!group || group.createdById !== user.id) {
                throw new Error("Unauthorized");
            }
        }

        const file = formData.get('file') as File;
        if (!file) {
            throw new Error('No file uploaded');
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Define the path: public/uploads/groups/[groupId]/cover.jpg
        // Or simpler: public/images/groups/[groupId]-cover.jpg to keep it clean
        const publicDir = join(process.cwd(), 'public', 'images', 'groups');

        // Ensure directory exists
        await mkdir(publicDir, { recursive: true });

        const fileName = `${groupId}-cover.jpg`;
        const filePath = join(publicDir, fileName);

        // Write the file (overwriting existing)
        await writeFile(filePath, buffer);

        // Update database record to point to this local file if it was previously an external URL
        // (This ensures consistency, though we might just rely on the path convention in the client)
        // Actually, let's store the path in DB to be safe if `group.coverPhoto` is used elsewhere.
        await prisma.group.update({
            where: { id: groupId },
            data: { coverPhoto: `/images/groups/${fileName}?v=${Date.now()}` }
        });


        // Revalidate
        revalidatePath(`/groups/${groupId}`);

        return { success: true, timestamp: Date.now() };
    } catch (error) {
        console.error('Error uploading group cover:', error);
        return { success: false, error: 'Failed to upload image' };
    }
}
