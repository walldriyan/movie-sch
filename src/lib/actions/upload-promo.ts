'use server';

import { writeFile, mkdir, readdir, unlink } from 'fs/promises';
import { join } from 'path';
import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';

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

    // Save to public/uploads/promo
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

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'promo');
    try {
        await mkdir(uploadDir, { recursive: true });
        const files = await readdir(uploadDir);

        // Return full urls with metadata (simple type guess based on extension)
        const fileList = files.map(file => {
            const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file);
            return {
                name: file,
                url: `/uploads/promo/${file}`,
                type: isImage ? 'image' : 'audio'
            };
        });

        // Sort by newest (assuming timestamp in name, or just alpha reverse might be close enough for now if timestamp is at start)
        // actually our naming is timestamp-name, so default sort is somewhat by timestamp but string based.
        // reverse to show newest first.
        return { success: true, files: fileList.reverse() as { name: string, url: string, type: string }[] };
    } catch (e) {
        return { success: false, error: "Failed to list files" };
    }
}

export async function deletePromoFile(fileUrlOrName: string) {
    const session = await auth();
    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        return { success: false, error: "Unauthorized" };
    }

    // Extract filename from URL if full URL is passed
    const basename = fileUrlOrName.split('/').pop();
    if (!basename || basename.includes('..') || basename.includes('/') || basename.includes('\\')) {
        return { success: false, error: "Invalid filename" };
    }

    const filePath = join(process.cwd(), 'public', 'uploads', 'promo', basename);
    try {
        await unlink(filePath);
        return { success: true };
    } catch (e) {
        console.error("Delete error", e);
        return { success: false, error: "Failed to delete file" };
    }
}
