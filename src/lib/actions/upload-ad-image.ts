'use server';

import { createClient } from '@supabase/supabase-js';
import { STORAGE_CONFIG } from '../storage-config';
import { v4 as uuidv4 } from 'uuid';

// Helper function to create Supabase client
function getSupabaseClient() {
    const accessKey = STORAGE_CONFIG.supabase.serviceKey || STORAGE_CONFIG.supabase.anonKey;
    return createClient(STORAGE_CONFIG.supabase.url, accessKey);
}

export async function uploadAdImage(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) {
            throw new Error('No file uploaded');
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate a unique filename using UUID
        const fileExt = file.name.split('.').pop();
        const fileName = `ads/${uuidv4()}.${fileExt}`;

        // Upload to Supabase Storage
        const supabase = getSupabaseClient();

        const { error: uploadError } = await supabase.storage
            .from(STORAGE_CONFIG.supabase.bucket)
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from(STORAGE_CONFIG.supabase.bucket)
            .getPublicUrl(fileName);

        return { success: true, url: publicUrl };
    } catch (error) {
        console.error('Error uploading ad image:', error);
        return { success: false, error: 'Failed to upload image' };
    }
}
