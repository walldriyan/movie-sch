'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { STORAGE_CONFIG } from '../storage-config';

// Helper function to create Supabase client with appropriate key
function getSupabaseClient() {
    const accessKey = STORAGE_CONFIG.supabase.serviceKey || STORAGE_CONFIG.supabase.anonKey;
    return createClient(STORAGE_CONFIG.supabase.url, accessKey);
}

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
            const group = await prisma.group.findUnique({ where: { id: groupId } });
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

        // Define the file path in Supabase Storage
        const fileName = `groups/${groupId}-cover.jpg`;

        // Upload to Supabase Storage
        const supabase = getSupabaseClient();

        // First, try to remove existing file (if any) - ignore errors
        await supabase.storage
            .from(STORAGE_CONFIG.supabase.bucket)
            .remove([fileName]);

        // Upload the new file
        const { error: uploadError } = await supabase.storage
            .from(STORAGE_CONFIG.supabase.bucket)
            .upload(fileName, buffer, {
                contentType: 'image/jpeg',
                upsert: true, // Overwrite if exists
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Construct the public URL
        const publicUrl = `${STORAGE_CONFIG.supabase.url}/storage/v1/object/public/${STORAGE_CONFIG.supabase.bucket}/${fileName}`;

        // Update database record with the new URL
        await prisma.group.update({
            where: { id: groupId },
            data: { coverPhoto: `${publicUrl}?v=${Date.now()}` }
        });

        // Revalidate
        revalidatePath(`/groups/${groupId}`);
        revalidatePath('/groups');

        return { success: true, timestamp: Date.now() };
    } catch (error) {
        console.error('Error uploading group cover:', error);
        return { success: false, error: 'Failed to upload image' };
    }
}
