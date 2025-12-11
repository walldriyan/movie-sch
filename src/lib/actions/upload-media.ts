'use server';

import { createClient } from '@supabase/supabase-js';
import { STORAGE_CONFIG } from '../storage-config';
import { randomUUID } from 'crypto';

function getSupabaseClient() {
    const accessKey = STORAGE_CONFIG.supabase.serviceKey || STORAGE_CONFIG.supabase.anonKey;
    return createClient(STORAGE_CONFIG.supabase.url, accessKey);
}

export async function uploadMedia(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        const folder = (formData.get('folder') as string) || 'uploads';

        if (!file) {
            throw new Error('No file uploaded');
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique ID
        const uniqueId = randomUUID();
        const extension = file.name.split('.').pop();
        const fileName = `${folder}/${uniqueId}.${extension}`;

        const supabase = getSupabaseClient();

        // Upload to Supabase Storage
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

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
            .from(STORAGE_CONFIG.supabase.bucket)
            .getPublicUrl(fileName);

        return {
            success: true,
            url: publicUrl,
            fileName: file.name
        };
    } catch (error) {
        console.error('Error uploading media:', error);
        return { success: false, error: 'Failed to upload media' };
    }
}
