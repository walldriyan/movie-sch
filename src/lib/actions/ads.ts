'use server';

import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/permissions';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

const AD_CONFIG_KEY = 'watch_page_ad_config';

export interface AdConfig {
    imageUrl: string;
    linkUrl: string;
    enabled: boolean;
}

export async function getAdConfig(): Promise<AdConfig> {
    const setting = await prisma.appSetting.findUnique({
        where: { key: AD_CONFIG_KEY }
    });

    if (!setting) {
        return {
            imageUrl: '',
            linkUrl: '',
            enabled: true
        };
    }

    try {
        return JSON.parse(setting.value);
    } catch (error) {
        return {
            imageUrl: '',
            linkUrl: '',
            enabled: true
        };
    }
}

export async function saveAdConfig(config: AdConfig) {
    const session = await auth();
    const user = session?.user;

    if (!user || user.role !== ROLES.SUPER_ADMIN) {
        throw new Error('Unauthorized');
    }

    await prisma.appSetting.upsert({
        where: { key: AD_CONFIG_KEY },
        update: { value: JSON.stringify(config) },
        create: { key: AD_CONFIG_KEY, value: JSON.stringify(config) }
    });

    revalidatePath('/search');
    return { success: true };
}
