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

// -----------------------------------------------------------------------------
// SPONSORED POSTS (Home Page Grid Ads)
// -----------------------------------------------------------------------------

export async function getSponsoredPosts() {
    try {
        // Fetch active ads sorted by priority (higher first)
        const ads = await prisma.sponsoredPost.findMany({
            where: { isActive: true },
            orderBy: { priority: 'desc' },
            cacheStrategy: { ttl: 60, swr: 60 }
        });
        return ads;
    } catch (error) {
        console.error("Failed to fetch sponsored posts:", error);
        return [];
    }
}

export async function createSponsoredPost(data: { title: string; imageUrl: string; link: string; description?: string; priority?: number }) {
    const session = await auth();
    if (!session?.user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role)) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const ad = await prisma.sponsoredPost.create({
            data
        });
        revalidatePath('/');
        return { success: true, ad };
    } catch (error) {
        return { success: false, error };
    }
}

export async function toggleSponsoredPostStatus(id: string, isActive: boolean) {
    const session = await auth();
    if (!session?.user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role)) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await prisma.sponsoredPost.update({ where: { id }, data: { isActive } });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
}

export async function deleteSponsoredPost(id: string) {
    const session = await auth();
    if (!session?.user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role)) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await prisma.sponsoredPost.delete({ where: { id } });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
}

// Temporary Seed Function for Testing
export async function seedAds() {
    const session = await auth();
    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        // Allow seeding if no ads exist regardless of auth for initial dev setup, or check count
        const count = await prisma.sponsoredPost.count();
        if (count > 0) return { success: false, error: 'Already seeded' };
    }

    try {
        await prisma.sponsoredPost.createMany({
            data: [
                {
                    title: 'The Future of AI',
                    description: 'Explore how AI is changing the landscape of technology.',
                    imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500&q=80',
                    link: 'https://openai.com',
                    priority: 10
                },
                {
                    title: 'Best Coffee in Town',
                    description: 'Start your morning with the perfect brew.',
                    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80',
                    link: 'https://starbucks.com',
                    priority: 5
                }
            ]
        });
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
}
