'use server';

import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/permissions';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

const AD_CONFIG_KEY = 'watch_page_ad_config';

export interface AdUnit {
    id: string;
    name: string;
    imageUrl: string;
    linkUrl: string;
    width: number;
    height: number;
    active: boolean;
}

export async function getAdsConfig(): Promise<AdUnit[]> {
    const setting = await prisma.appSetting.findUnique({
        where: { key: AD_CONFIG_KEY }
    });

    if (!setting) {
        return [];
    }

    try {
        const parsed = JSON.parse(setting.value);
        // Handle migration from old single object format to new array format if necessary
        if (!Array.isArray(parsed)) {
            // If it was the old single object format, convert it or return empty/default
            if (parsed.imageUrl) {
                return [{
                    id: 'legacy_ad',
                    name: 'Legacy Ad',
                    imageUrl: parsed.imageUrl,
                    linkUrl: parsed.linkUrl,
                    width: 300,
                    height: 250,
                    active: parsed.enabled
                }];
            }
            return [];
        }
        return parsed;
    } catch (error) {
        return [];
    }
}

export async function updateAdsConfig(ads: AdUnit[]) {
    const session = await auth();
    const user = session?.user;

    if (!user || user.role !== ROLES.SUPER_ADMIN) {
        throw new Error('Unauthorized');
    }

    await prisma.appSetting.upsert({
        where: { key: AD_CONFIG_KEY },
        update: { value: JSON.stringify(ads) },
        create: { key: AD_CONFIG_KEY, value: JSON.stringify(ads) }
    });

    revalidatePath('/search');
    revalidatePath('/admin');
    return { success: true };
}
