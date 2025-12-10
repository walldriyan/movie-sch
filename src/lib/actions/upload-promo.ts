'use server';

import { writeFile, mkdir, readdir, unlink } from 'fs/promises';
import { join } from 'path';
import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import { STORAGE_CONFIG } from '../storage-config';
import { createClient } from '@supabase/supabase-js';

// Helper to get supabase client
function getSupabaseClient() {
    const accessKey = STORAGE_CONFIG.supabase.serviceKey || STORAGE_CONFIG.supabase.anonKey;
    return createClient(STORAGE_CONFIG.supabase.url, accessKey);
}

export async function uploadPromoFile(formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        return { success: false, error: "Unauthorized" };
    }

    const file = formData.get('file') as File;
    if (!file) {
        return { success: false, error: "No file provided" };
    }

    // Validate file type (basic)
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');

    if (!isImage && !isAudio) {
        return { success: false, error: "Invalid file type. Only images and audio allowed." };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, ''); // Sanitize
    const filename = `${uniqueSuffix}-${originalName}`;

    // SUPABASE UPLOAD (Priority)
    if (STORAGE_CONFIG.provider === 'supabase') {
        try {
            const supabase = getSupabaseClient();
            const filePath = `promo/${filename}`;

            const { error } = await supabase.storage
                .from(STORAGE_CONFIG.supabase.bucket)
                .upload(filePath, buffer, {
                    contentType: file.type,
                    upsert: false
                });

            if (error) {
                console.error("Supabase Upload Error:", error);
                return { success: false, error: "Upload failed: " + error.message };
            }

            const publicUrl = `${STORAGE_CONFIG.supabase.url}/storage/v1/object/public/${STORAGE_CONFIG.supabase.bucket}/${filePath}`;
            return { success: true, url: publicUrl, type: isImage ? 'image' : 'audio', name: file.name };

        } catch (error) {
            console.error("Supabase unexpected error:", error);
            return { success: false, error: "Upload failed: " + (error as any).message };
        }
    }

    // LOCAL UPLOAD (Fallback)
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'promo');

    try {
        await mkdir(uploadDir, { recursive: true });
        await writeFile(join(uploadDir, filename), buffer);

        const publicPath = `/uploads/promo/${filename}`;
        return { success: true, url: publicPath, type: isImage ? 'image' : 'audio', name: file.name };
    } catch (error) {
        console.error('Error uploading file:', error);
        return { success: false, error: "Failed to save file" };
    }
}

export async function getPromoFiles() {
    const session = await auth();
    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        return { success: false, error: "Unauthorized" };
    }

    // SUPABASE LIST
    if (STORAGE_CONFIG.provider === 'supabase') {
        try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase.storage
                .from(STORAGE_CONFIG.supabase.bucket)
                .list('promo', {
                    limit: 100,
                    sortBy: { column: 'created_at', order: 'desc' }
                });

            if (error) {
                console.error("Supabase List Error:", error);
                return { success: false, error: "Failed to list files" };
            }

            const files = data
                .filter(f => f.name !== '.emptyFolderPlaceholder')
                .map(file => {
                    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
                    return {
                        name: file.name,
                        url: `${STORAGE_CONFIG.supabase.url}/storage/v1/object/public/${STORAGE_CONFIG.supabase.bucket}/promo/${file.name}`,
                        type: isImage ? 'image' : 'audio'
                    };
                });

            return { success: true, files };
        } catch (error) {
            return { success: false, error: "Failed to list files from Supabase" };
        }
    }

    // LOCAL LIST
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'promo');
    try {
        await mkdir(uploadDir, { recursive: true });
        const files = await readdir(uploadDir);

        const fileList = files.map(file => {
            const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file);
            return {
                name: file,
                url: `/uploads/promo/${file}`,
                type: isImage ? 'image' : 'audio'
            };
        });

        return { success: true, files: fileList.reverse() as { name: string, url: string, type: string }[] };
    } catch (e) {
        // If folder doesn't exist locally, just return empty list
        return { success: true, files: [] };
    }
}

export async function deletePromoFile(fileUrlOrName: string) {
    const session = await auth();
    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        return { success: false, error: "Unauthorized" };
    }

    const basename = fileUrlOrName.split('/').pop();
    if (!basename || basename.includes('..') || basename.includes('/') || basename.includes('\\')) {
        return { success: false, error: "Invalid filename" };
    }

    // SUPABASE DELETE
    if (STORAGE_CONFIG.provider === 'supabase') {
        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.storage
                .from(STORAGE_CONFIG.supabase.bucket)
                .remove([`promo/${basename}`]);

            if (error) {
                console.error("Supabase Delete Error:", error);
                return { success: false, error: "Failed to delete" };
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: "Failed to delete" };
        }
    }

    // LOCAL DELETE
    const filePath = join(process.cwd(), 'public', 'uploads', 'promo', basename);
    try {
        await unlink(filePath);
        return { success: true };
    } catch (e) {
        console.error("Delete error", e);
        return { success: false, error: "Failed to delete file" };
    }
}
