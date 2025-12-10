'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import prisma from '@/lib/prisma';

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

const SETTING_KEY = 'featured_promo';

const DEFAULT_DATA: PromoData = {
    active: false,
    type: 'image',
    mediaUrl: '',
    title: '',
    description: ''
};

export async function getPromoData(): Promise<PromoData> {
    try {
        const setting = await prisma.appSetting.findUnique({
            where: { key: SETTING_KEY }
        });

        if (setting?.value) {
            return JSON.parse(setting.value);
        }

        return DEFAULT_DATA;
    } catch (error) {
        console.error("Error reading promo data from DB:", error);
        return DEFAULT_DATA;
    }
}

export async function updatePromoData(data: PromoData) {
    const session = await auth();
    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        throw new Error("Unauthorized");
    }

    try {
        await prisma.appSetting.upsert({
            where: { key: SETTING_KEY },
            update: { value: JSON.stringify(data) },
            create: { key: SETTING_KEY, value: JSON.stringify(data) }
        });

        revalidatePath('/'); // Revalidate home page
        return { success: true };
    } catch (error) {
        console.error("Error writing promo data to DB:", error);
        return { success: false, error: "Failed to save changes" };
    }
}
