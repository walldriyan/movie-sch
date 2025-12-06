
'use server';

import { revalidatePath } from 'next/cache';
import { STORAGE_CONFIG } from '../../storage-config';
import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { redis } from '../../redis';
import prisma from '@/lib/prisma';

// --- CACHE UTILS ---

export async function invalidatePostsCache(postId?: number, seriesId?: number, authorId?: string) {
    console.log(`[Cache] invalidatePostsCache called with: postId=${postId}, seriesId=${seriesId}, authorId=${authorId}`);
    revalidatePath('/');
    revalidatePath('/manage');
    if (postId) {
        revalidatePath(`/movies/${postId}`);
    }
    if (seriesId) {
        revalidatePath(`/series/${seriesId}`);
    }
    if (authorId) {
        revalidatePath(`/profile/${authorId}`);
    }
}

export async function getUserGroupIds(userId: string): Promise<string[]> {
    const cacheKey = `user:${userId}:groups`;

    if (redis) {
        try {
            const cached = await redis.get<string[]>(cacheKey);
            if (cached) return cached;
        } catch (error) {
            console.error('[Cache] Redis GET error for user groups:', error);
        }
    }

    const members = await prisma.groupMember.findMany({
        where: { userId, status: 'ACTIVE' },
        select: { groupId: true },
    });

    const groupIds = members.map(m => m.groupId);

    if (redis) {
        try {
            await redis.set(cacheKey, groupIds, { ex: 1800 }); // 30 minutes
        } catch (error) {
            console.error('[Cache] Redis SET error for user groups:', error);
        }
    }

    return groupIds;
}

export async function invalidateUserGroupsCache(userId: string) {
    if (redis) {
        const cacheKey = `user:${userId}:groups`;
        await redis.del(cacheKey);
        console.log(`[Cache] Invalidated user groups cache for userId: ${userId}`);
    }
}

// --- IMAGE / FILE UTILS ---

export async function saveImageFromDataUrl(dataUrl: string, subfolder: string): Promise<string | null> {
    console.log(`[Image Save] Saving image to subfolder: ${subfolder}`);
    if (!dataUrl.startsWith('data:image')) {
        console.log(`[Image Save] Provided URL is not a data URL, returning as is: ${dataUrl}`);
        return dataUrl;
    }

    try {
        const fileType = dataUrl.substring(dataUrl.indexOf('/') + 1, dataUrl.indexOf(';'));
        const base64Data = dataUrl.substring(dataUrl.indexOf(',') + 1);
        const buffer = Buffer.from(base64Data, 'base64');

        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileType}`;

        if (STORAGE_CONFIG.provider === 'local') {
            const directory = join(process.cwd(), STORAGE_CONFIG.localRoot, subfolder);
            const path = join(directory, filename);

            await mkdir(directory, { recursive: true });
            await writeFile(path, buffer);
            console.log(`[Image Save] Saved local file: ${path}`);

            const prefix = STORAGE_CONFIG.publicUrlPrefix.replace(/\/$/, '');
            const publicUrl = `${prefix}/${subfolder}/${filename}`;
            return publicUrl;

        } else if (STORAGE_CONFIG.provider === 'supabase') {
            console.log('[Image Save] Uploading to Supabase Storage...');
            const supabase = createClient(STORAGE_CONFIG.supabase.url, STORAGE_CONFIG.supabase.anonKey);

            const { error } = await supabase.storage
                .from(STORAGE_CONFIG.supabase.bucket)
                .upload(`${subfolder}/${filename}`, buffer, {
                    contentType: `image/${fileType}`,
                    upsert: false
                });

            if (error) {
                console.error('[Image Save] Supabase upload error:', error);
                throw error;
            }

            const { data: { publicUrl } } = supabase.storage
                .from(STORAGE_CONFIG.supabase.bucket)
                .getPublicUrl(`${subfolder}/${filename}`);

            console.log(`[Image Save] Upload successful. Public URL: ${publicUrl}`);
            return publicUrl;
        } else {
            console.warn(`[Image Save] Provider '${STORAGE_CONFIG.provider}' not implemented yet.`);
            return null;
        }
    } catch (error) {
        console.error("[Image Save] Error saving image from data URL:", error);
        return null;
    }
}

export async function deleteUploadedFile(filePath: string | null | undefined) {
    if (!filePath) return;

    if (STORAGE_CONFIG.provider === 'local') {
        if (!filePath.startsWith(STORAGE_CONFIG.publicUrlPrefix)) return;
        try {
            const relativePath = filePath.substring(STORAGE_CONFIG.publicUrlPrefix.length);
            const fullPath = join(process.cwd(), STORAGE_CONFIG.localRoot, relativePath);
            await unlink(fullPath);
            console.log(`[File System] Deleted file: ${fullPath}`);
        } catch (error) {
            console.error(`Failed to delete file: ${filePath}`, error);
        }
    } else if (STORAGE_CONFIG.provider === 'supabase') {
        try {
            const bucketUrl = `${STORAGE_CONFIG.supabase.url}/storage/v1/object/public/${STORAGE_CONFIG.supabase.bucket}/`;
            if (!filePath.startsWith(bucketUrl)) return;

            const relativePath = filePath.replace(bucketUrl, '');
            console.log(`[File Delete] Deleting from Supabase: ${relativePath}`);

            const supabase = createClient(STORAGE_CONFIG.supabase.url, STORAGE_CONFIG.supabase.anonKey);
            await supabase.storage.from(STORAGE_CONFIG.supabase.bucket).remove([relativePath]);
            console.log('[File Delete] Successfully deleted from Supabase');
        } catch (error) {
            console.error(`Failed to delete file from Supabase: ${filePath}`, error);
        }
    }
}
