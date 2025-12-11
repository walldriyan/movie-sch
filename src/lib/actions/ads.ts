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


export async function getAdminSponsoredPosts(status?: 'PENDING' | 'APPROVED' | 'REJECTED', page: number = 1, limit: number = 10) {
    const session = await auth();
    if (!session?.user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role)) {
        return { data: [], totalPages: 0, currentPage: 1, total: 0 };
    }

    try {
        const where = status ? { status } : {};
        const [ads, total] = await prisma.$transaction([
            prisma.sponsoredPost.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: { user: true, payment: true },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.sponsoredPost.count({ where })
        ]);

        // Serialize to avoid Date issues in client components
        return {
            data: JSON.parse(JSON.stringify(ads)),
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        };
    } catch (error) {
        return { data: [], totalPages: 0, currentPage: 1, total: 0 };
    }
}

export async function getAdminPayments(page: number = 1, limit: number = 10) {
    const session = await auth();
    if (!session?.user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role)) {
        return { data: [], totalPages: 0, currentPage: 1, total: 0 };
    }

    try {
        const [payments, total] = await prisma.$transaction([
            prisma.adPayment.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    usedByUser: true,
                    assignedToUser: true
                } as any,
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.adPayment.count()
        ]);

        return {
            data: JSON.parse(JSON.stringify(payments)),
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        };
    } catch (error) {
        return { data: [], totalPages: 0, currentPage: 1, total: 0 };
    }
}

export async function getSponsoredPosts() {
    try {
        // Fetch active ads sorted by priority (higher first)
        const ads = await prisma.sponsoredPost.findMany({
            where: { isActive: true, status: 'APPROVED' },
            orderBy: { createdAt: 'desc' } // Newest ad first
        });
        return ads;
    } catch (error) {
        console.error("Failed to fetch sponsored posts:", error);
        return [];
    }
}

export async function getRecentApprovedAds(page: number = 1, limit: number = 12) {
    try {
        const where: any = { status: 'APPROVED', isActive: true };

        const [ads, total] = await prisma.$transaction([
            prisma.sponsoredPost.findMany({
                where,
                orderBy: { createdAt: 'desc' }, // Last ad first
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.sponsoredPost.count({ where })
        ]);

        return {
            posts: JSON.parse(JSON.stringify(ads)),
            totalPages: Math.ceil(total / limit),
            currentPage: page
        };
    } catch (error) {
        console.error("getRecentApprovedAds Error:", error);
        return { posts: [], totalPages: 0, currentPage: 1 };
    }
}

export async function createSponsoredPost(data: { title: string; imageUrl: string; link: string; description?: string; priority?: number; status?: 'PENDING' | 'APPROVED' | 'REJECTED'; isActive?: boolean; userId?: string }) {
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

// Verify Payment Code
export async function verifyPaymentCode(code: string) {
    try {
        const session = await auth();
        const payment = await prisma.adPayment.findUnique({
            where: { code }
        });

        if (!payment) {
            return { success: false, error: 'Invalid Code' };
        }

        if (payment.isUsed) {
            return { success: false, error: 'Code already used' };
        }

        if ((payment as any).assignedToUserId && (payment as any).assignedToUserId !== session?.user?.id) {
            return { success: false, error: 'Code is not assigned to you' };
        }

        return { success: true, payment };
    } catch (error) {
        return { success: false, error: 'Verification failed' };
    }
}

export async function submitAd(data: { title: string; imageUrl: string; link: string; description?: string; paymentCode?: string }) {
    const session = await auth();
    if (!session?.user) {
        return { success: false, error: 'Unauthorized' };
    }

    const { paymentCode, ...adData } = data;

    // Check Permissions
    // Check Permissions
    const isPrivileged = [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role);

    // Check Premium Status
    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { accountType: true }
    });
    const isPremium = String(dbUser?.accountType) === 'PREMIUM';

    let paymentId: string | undefined;

    // Logic: If not privileged and not premium, require Payment Code
    if (!isPrivileged && !isPremium) {
        if (!paymentCode) {
            return { success: false, error: 'Payment Code Required' };
        }

        const verification = await verifyPaymentCode(paymentCode);
        if (!verification.success || !verification.payment) {
            return { success: false, error: verification.error || 'Invalid Payment' };
        }

        paymentId = verification.payment.id;
    }

    try {
        // Use transaction to ensure code is marked used only if ad is created
        const ad = await prisma.$transaction(async (tx) => {
            if (paymentId) {
                await tx.adPayment.update({
                    where: { id: paymentId },
                    data: {
                        isUsed: true,
                        usedAt: new Date(),
                        usedByUserId: session.user.id
                    }
                });
            }

            return await tx.sponsoredPost.create({
                data: {
                    ...adData,
                    priority: 0,
                    status: 'PENDING',
                    isActive: false,
                    userId: session.user.id,
                    paymentId: paymentId
                }
            });
        });

        revalidatePath('/');
        return { success: true, ad };
    } catch (error) {
        console.error("Failed to submit ad", error);
        return { success: false, error: 'Failed to submit ad' };
    }
}

// Analytics Actions
export async function incrementAdView(adId: string) {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Simple increment on main record
        await prisma.sponsoredPost.update({
            where: { id: adId },
            data: { views: { increment: 1 } }
        });

        // Analytics record
        const exists = await prisma.adAnalytics.findUnique({
            where: { postId_date: { postId: adId, date: today } }
        });

        if (exists) {
            await prisma.adAnalytics.update({
                where: { postId_date: { postId: adId, date: today } },
                data: { views: { increment: 1 } }
            });
        } else {
            await prisma.adAnalytics.create({
                data: { postId: adId, date: today, views: 1 }
            });
        }

        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

export async function clickAd(adId: string) {
    try {
        const today = new Date().toISOString().split('T')[0];

        await prisma.sponsoredPost.update({
            where: { id: adId },
            data: { clicks: { increment: 1 } }
        });

        const exists = await prisma.adAnalytics.findUnique({
            where: { postId_date: { postId: adId, date: today } }
        });

        if (exists) {
            await prisma.adAnalytics.update({
                where: { postId_date: { postId: adId, date: today } },
                data: { clicks: { increment: 1 } }
            });
        } else {
            await prisma.adAnalytics.create({
                data: { postId: adId, date: today, clicks: 1 }
            });
        }

        return { success: true };
    } catch (e) {
        return { success: false };
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
    if (!session?.user) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const ad = await prisma.sponsoredPost.findUnique({ where: { id } });
        if (!ad) return { success: false, error: 'Not found' };

        const isOwner = ad.userId === session.user.id;
        const isAdmin = [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role);

        if (!isOwner && !isAdmin) {
            return { success: false, error: 'Unauthorized' };
        }

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
                    priority: 10,
                    status: 'APPROVED',
                    isActive: true
                },
                {
                    title: 'Best Coffee in Town',
                    description: 'Start your morning with the perfect brew.',
                    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80',
                    link: 'https://starbucks.com',
                    priority: 5,
                    status: 'APPROVED',
                    isActive: true
                }

            ]
        });
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
}


export async function updateSponsoredPostStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'PENDING') {
    const session = await auth();
    if (!session?.user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role)) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await prisma.sponsoredPost.update({
            where: { id },
            data: {
                status,
                isActive: status === 'APPROVED' // Auto activate on approve
            }
        });
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        return { success: false, error: 'Failed' };
    }
}

export async function generatePaymentCode(amount: number, durationDays: number, assignedToUserId?: string) {
    const session = await auth();
    if (!session?.user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role)) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
        const code = `P-${randomStr.substring(0, 4)}-${randomStr.substring(4, 8)}`;

        const payment = await prisma.adPayment.create({
            data: {
                code,
                amount,
                durationDays,
                currency: 'LKR',
                assignedToUserId
            } as any
        });
        return { success: true, payment };
    } catch (e) {
        return { success: false, error: 'Failed' };
    }
}

export async function deletePaymentCode(id: string) {
    const session = await auth();
    if (!session?.user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role)) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await prisma.adPayment.delete({ where: { id } });
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete code' };
    }
}

export async function updatePaymentCode(id: string, amount: number, durationDays: number) {
    const session = await auth();
    if (!session?.user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role)) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const payment = await prisma.adPayment.update({
            where: { id },
            data: { amount, durationDays }
        });
        return { success: true, payment };
    } catch (error) {
        return { success: false, error: 'Failed to update code' };
    }
}


export async function toggleUserAdStatus(adId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    try {
        const ad = await prisma.sponsoredPost.findUnique({ where: { id: adId } });
        if (!ad || ad.userId !== session.user.id) return { success: false, error: "Not found" };

        if (ad.status !== 'APPROVED') return { success: false, error: "Only approved ads can be toggled." };

        const updated = await prisma.sponsoredPost.update({
            where: { id: adId },
            data: { isActive: !ad.isActive }
        });

        revalidatePath('/profile');
        revalidatePath('/search');
        return { success: true, isActive: updated.isActive };
    } catch (e) {
        return { success: false, error: "Error updating status" };
    }
}
