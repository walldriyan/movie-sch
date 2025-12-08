'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export interface AdUnit {
    id: string;
    name: string;
    imageUrl: string;
    linkUrl: string;
    width: number;
    height: number;
    active: boolean;
}

const AD_CONFIG_KEY = 'AD_CONFIG';

const DEFAULT_ADS: AdUnit[] = [
    {
        id: 'home_banner',
        name: 'Home Page Banner',
        imageUrl: '',
        linkUrl: '',
        width: 728,
        height: 90,
        active: false,
    },
    {
        id: 'post_sidebar',
        name: 'Post Sidebar',
        imageUrl: '',
        linkUrl: '',
        width: 300,
        height: 250,
        active: false,
    },
    {
        id: 'post_bottom',
        name: 'Post Bottom',
        imageUrl: '',
        linkUrl: '',
        width: 728,
        height: 90,
        active: false,
    }
];

export async function getAdsConfig(): Promise<AdUnit[]> {
    try {
        const setting = await prisma.appSetting.findUnique({
            where: { key: AD_CONFIG_KEY },
        });

        if (!setting) {
            return DEFAULT_ADS;
        }

        return JSON.parse(setting.value);
    } catch (error) {
        console.error('Failed to fetch ads config:', error);
        return DEFAULT_ADS;
    }
}

export async function updateAdsConfig(newConfig: AdUnit[]) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
            throw new Error('Unauthorized');
        }

        await prisma.appSetting.upsert({
            where: { key: AD_CONFIG_KEY },
            create: {
                key: AD_CONFIG_KEY,
                value: JSON.stringify(newConfig),
            },
            update: {
                value: JSON.stringify(newConfig),
            },
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to update ads config:', error);
        throw new Error('Failed to update advertisement settings');
    }
}
