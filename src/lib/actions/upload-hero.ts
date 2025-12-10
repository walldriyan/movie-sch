'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { STORAGE_CONFIG } from '../storage-config';

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

        // Define the file path in Supabase Storage
        const fileName = 'hero/hero-cover.jpg';

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

        // Revalidate the home page to reflect changes
        revalidatePath('/');

        return { success: true, timestamp: Date.now() };
    } catch (error) {
        console.error('Error uploading hero image:', error);
        return { success: false, error: 'Failed to upload image' };
    }
}
