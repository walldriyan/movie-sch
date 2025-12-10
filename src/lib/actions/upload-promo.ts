'use server';

import { writeFile, mkdir } from 'fs/promises';
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
