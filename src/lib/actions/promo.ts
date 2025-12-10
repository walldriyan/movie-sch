'use server';

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';

const PROMO_FILE_PATH = path.join(process.cwd(), 'src/config/featured-promo.json');

export interface AudioTrack {
    title: string;
    url: string;
}

export interface PromoData {
    active: boolean;
    type: 'video' | 'image' | 'audio';
    mediaUrl: string; // YouTube ID/URL, Image URL, or Audio Cover Image
    title: string;
    description: string;
    linkUrl?: string; // For 'post' or generic click
    audioTracks?: AudioTrack[];
}

export async function getPromoData(): Promise<PromoData> {
    try {
        const data = await fs.readFile(PROMO_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading promo file:", error);
        // Fallback default
        return {
            active: false,
            type: 'image',
            mediaUrl: '',
            title: '',
            description: ''
        };
    }
}

export async function updatePromoData(data: PromoData) {
    const session = await auth();
    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        throw new Error("Unauthorized");
    }

    try {
        await fs.writeFile(PROMO_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
        revalidatePath('/'); // Revalidate home page
        return { success: true };
    } catch (error) {
        console.error("Error writing promo file:", error);
        return { success: false, error: "Failed to save changes" };
    }
}
