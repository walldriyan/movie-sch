'use server';

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { revalidatePath } from 'next/cache';

export async function uploadHeroImage(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) {
            throw new Error('No file uploaded');
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Define the path: public/images/hero-cover.jpg
        const publicDir = join(process.cwd(), 'public', 'images');

        // Ensure directory exists
        await mkdir(publicDir, { recursive: true });

        const filePath = join(publicDir, 'hero-cover.jpg');

        // Write the file (overwriting existing)
        await writeFile(filePath, buffer);

        // Revalidate the home page to reflect changes
        revalidatePath('/');

        return { success: true, timestamp: Date.now() };
    } catch (error) {
        console.error('Error uploading hero image:', error);
        return { success: false, error: 'Failed to upload image' };
    }
}
