'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { STORAGE_CONFIG } from '../storage-config';
import { randomUUID } from 'crypto';

// Helper function to create Supabase client with appropriate key
function getSupabaseClient() {
    const accessKey = STORAGE_CONFIG.supabase.serviceKey || STORAGE_CONFIG.supabase.anonKey;
    return createClient(STORAGE_CONFIG.supabase.url, accessKey);
}

export async function uploadHeroImage(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) {
            throw new Error('No file uploaded');
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique ID for the hero cover
        const uniqueId = randomUUID();
        const fileName = `hero/hero-cover-${uniqueId}.jpg`;

        // Upload to Supabase Storage
        const supabase = getSupabaseClient();

        // First, delete all existing hero covers in the folder
        const { data: existingFiles } = await supabase.storage
            .from(STORAGE_CONFIG.supabase.bucket)
            .list('hero');

        if (existingFiles && existingFiles.length > 0) {
            const filesToDelete = existingFiles.map(f => `hero/${f.name}`);
            await supabase.storage
                .from(STORAGE_CONFIG.supabase.bucket)
                .remove(filesToDelete);
        }

        // Upload the new file with unique ID
        const { error: uploadError } = await supabase.storage
            .from(STORAGE_CONFIG.supabase.bucket)
            .upload(fileName, buffer, {
                contentType: 'image/jpeg',
                upsert: true,
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
            .from(STORAGE_CONFIG.supabase.bucket)
            .getPublicUrl(fileName);

        // Revalidate the home page to reflect changes
        revalidatePath('/');

        return {
            success: true,
            timestamp: Date.now(),
            imageUrl: publicUrl
        };
    } catch (error) {
        console.error('Error uploading hero image:', error);
        return { success: false, error: 'Failed to upload image' };
    }
}

// Function to get the current hero cover from Supabase
export async function getHeroCoverUrl(): Promise<string | null> {
    try {
        const supabase = getSupabaseClient();

        // List files in hero folder
        const { data: files, error } = await supabase.storage
            .from(STORAGE_CONFIG.supabase.bucket)
            .list('hero', {
                limit: 1,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        if (error || !files || files.length === 0) {
            return null;
        }

        // Get the most recent hero cover
        const latestFile = files[0];
        const { data: { publicUrl } } = supabase.storage
            .from(STORAGE_CONFIG.supabase.bucket)
            .getPublicUrl(`hero/${latestFile.name}`);

        return publicUrl;
    } catch (error) {
        console.error('Error getting hero cover:', error);
        return null;
    }
}
