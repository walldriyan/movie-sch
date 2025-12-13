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
        const now = new Date();
        // Fetch active ads that haven't expired, sorted by priority (higher first)
        const ads = await prisma.sponsoredPost.findMany({
            where: {
                isActive: true,
                status: 'APPROVED',
                // Only show ads that haven't expired (or have no endDate set)
                OR: [
                    { endDate: null },
                    { endDate: { gt: now } }
                ]
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        return ads;
    } catch (error) {
        console.error("Failed to fetch sponsored posts:", error);
        return [];
    }
}

export async function getRecentApprovedAds(page: number = 1, limit: number = 12) {
    try {
        const now = new Date();
        const where: any = {
            status: 'APPROVED',
            isActive: true,
            // Only show non-expired ads
            OR: [
                { endDate: null },
                { endDate: { gt: now } }
            ]
        };

        const [ads, total] = await prisma.$transaction([
            prisma.sponsoredPost.findMany({
                where,
                orderBy: [
                    { priority: 'desc' },
                    { createdAt: 'desc' }
                ],
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
    const isPrivileged = [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role);

    // Check Premium Status
    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { accountType: true }
    });
    const isPremium = String(dbUser?.accountType) === 'PREMIUM';

    let paymentId: string | undefined;
    let paymentDurationDays: number = 30; // Default duration

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
        paymentDurationDays = verification.payment.durationDays || 30;
    }

    // Calculate end date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + paymentDurationDays);

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
                    paymentId: paymentId,
                    endDate: endDate // ✅ Now saving endDate!
                }
            });
        });

        revalidatePath('/');
        revalidatePath('/profile');
        return { success: true, ad };
    } catch (error) {
        console.error("Failed to submit ad", error);
        return { success: false, error: 'Failed to submit ad' };
    }
}

// Analytics Actions - Optimized with upsert pattern
export async function incrementAdView(adId: string) {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Use transaction with upsert for atomic, efficient operation
        await prisma.$transaction([
            prisma.sponsoredPost.update({
                where: { id: adId },
                data: { views: { increment: 1 } }
            }),
            prisma.adAnalytics.upsert({
                where: { postId_date: { postId: adId, date: today } },
                update: { views: { increment: 1 } },
                create: { postId: adId, date: today, views: 1 }
            })
        ]);

        return { success: true };
    } catch (e) {
        console.error('incrementAdView error:', e);
        return { success: false };
    }
}

export async function clickAd(adId: string) {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Use transaction with upsert for atomic, efficient operation
        await prisma.$transaction([
            prisma.sponsoredPost.update({
                where: { id: adId },
                data: { clicks: { increment: 1 } }
            }),
            prisma.adAnalytics.upsert({
                where: { postId_date: { postId: adId, date: today } },
                update: { clicks: { increment: 1 } },
                create: { postId: adId, date: today, clicks: 1 }
            })
        ]);

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
        // Get ad with payment info to determine duration
        const ad = await prisma.sponsoredPost.findUnique({
            where: { id },
            include: { payment: true }
        });

        if (!ad) return { success: false, error: 'Ad not found' };

        const updateData: any = {
            status,
            isActive: status === 'APPROVED'
        };

        // If approving and no endDate set, calculate it
        if (status === 'APPROVED' && !ad.endDate) {
            const durationDays = ad.payment?.durationDays || 30; // Default 30 days
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + durationDays);
            updateData.endDate = endDate;
        }

        await prisma.sponsoredPost.update({
            where: { id },
            data: updateData
        });

        revalidatePath('/');
        revalidatePath('/profile');
        revalidatePath('/admin');
        return { success: true };
    } catch (e) {
        console.error('updateSponsoredPostStatus error:', e);
        return { success: false, error: 'Failed to update status' };
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

export async function getUserAdCreationConfig() {
    const session = await auth();
    if (!session?.user) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { adBalance: true }
    });

    const packages = await prisma.adPackage.findMany({
        where: { isActive: true },
        orderBy: { pricePerDay: 'asc' }
    });

    return {
        balance: user?.adBalance || 0,
        packages
    };
}

export async function submitAdWithPackage(data: { title: string, imageUrl: string, link: string, description?: string, packageId: string, days: number, paymentCode?: string }) {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    // Validation
    const pkg = await prisma.adPackage.findUnique({ where: { id: data.packageId } });
    if (!pkg) return { success: false, error: 'Invalid Package' };

    // Determine actual duration - use code's duration if available, otherwise user's input
    let actualDays = data.days;
    let adPaymentRecord: any = null;

    // Pre-check payment code to get duration
    if (data.paymentCode) {
        adPaymentRecord = await prisma.adPayment.findUnique({ where: { code: data.paymentCode } });
        if (!adPaymentRecord) return { success: false, error: 'Invalid Payment Code' };
        if (adPaymentRecord.isUsed) return { success: false, error: 'Payment Code Already Used' };

        // Use the pre-defined duration from the payment code if it exists
        if (adPaymentRecord.durationDays && adPaymentRecord.durationDays > 0) {
            actualDays = adPaymentRecord.durationDays;
        }
    }

    // Validate duration against package limits
    if (actualDays < pkg.minDays || actualDays > pkg.maxDays) {
        return { success: false, error: `Duration must be between ${pkg.minDays} and ${pkg.maxDays} days` };
    }

    const cost = pkg.pricePerDay * actualDays;

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + actualDays);

    try {
        await prisma.$transaction(async (tx) => {
            let paymentRecordId = '';
            let adPaymentId: string | undefined = undefined;

            if (data.paymentCode && adPaymentRecord) {
                // Validate code value
                if (adPaymentRecord.amount < cost) {
                    throw new Error(`Insufficient Code Value. Required: LKR ${cost}, Code: LKR ${adPaymentRecord.amount}`);
                }

                // Mark Used
                await tx.adPayment.update({
                    where: { id: adPaymentRecord.id },
                    data: {
                        isUsed: true,
                        usedByUserId: session.user.id,
                        usedAt: new Date()
                    }
                });
                adPaymentId = adPaymentRecord.id;

                // Create Payment Record
                const pr = await tx.paymentRecord.create({
                    data: {
                        userId: session.user.id,
                        amount: cost,
                        method: 'MANUAL_KEY',
                        type: 'AD_CAMPAIGN',
                        status: 'COMPLETED'
                    }
                });
                paymentRecordId = pr.id;

            } else {
                // Deduct Balance (Legacy/Fallback)
                const user = await tx.user.findUnique({ where: { id: session.user.id } });
                if (!user || (user.adBalance || 0) < cost) {
                    throw new Error('Insufficient Balance. Please use a payment code or top up your balance.');
                }

                await tx.user.update({
                    where: { id: session.user.id },
                    data: { adBalance: { decrement: cost } }
                });

                const pr = await tx.paymentRecord.create({
                    data: {
                        userId: session.user.id,
                        amount: cost,
                        method: 'ADMIN_GRANT',
                        type: 'AD_CAMPAIGN',
                        status: 'COMPLETED'
                    }
                });
                paymentRecordId = pr.id;
            }

            // Create Sponsored Post with calculated endDate
            await tx.sponsoredPost.create({
                data: {
                    title: data.title,
                    imageUrl: data.imageUrl,
                    link: data.link,
                    description: data.description,
                    priority: Math.floor(pkg.pricePerDay / 10),
                    status: 'PENDING',
                    isActive: false,
                    userId: session.user.id,
                    paymentRecordId: paymentRecordId,
                    paymentId: adPaymentId,
                    endDate: endDate, // ✅ Now saving the calculated end date!
                }
            });
        });

        revalidatePath('/');
        revalidatePath('/profile');
        return { success: true };
    } catch (e: any) {
        console.error('submitAdWithPackage Error:', e);
        return { success: false, error: e.message || 'Transaction Failed' };
    }
}

export async function requestAdKey(packageId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const pkg = await prisma.adPackage.findUnique({ where: { id: packageId } });
    if (!pkg) return { success: false, error: 'Package not found' };

    // Check for existing pending request
    const existing = await prisma.adAccessRequest.findFirst({
        where: {
            userId: session.user.id,
            packageId: packageId,
            status: 'PENDING'
        }
    });

    if (existing) {
        return { success: false, error: 'You already have a pending request for this package.' };
    }

    try {
        await prisma.adAccessRequest.create({
            data: {
                userId: session.user.id,
                packageId: packageId,
                status: 'PENDING'
            }
        });

        // Find Admins
        const admins = await prisma.user.findMany({
            where: { role: ROLES.SUPER_ADMIN as any },
            select: { id: true }
        });

        if (admins.length > 0) {
            await prisma.notification.create({
                data: {
                    title: 'Ad Key Request',
                    message: `User ${session.user.name} (${session.user.email}) requested a key for package: ${pkg.name} (${pkg.pricePerDay} LKR/Day).`,
                    type: 'CUSTOM' as any,
                    senderId: session.user.id,
                    users: {
                        create: admins.map(admin => ({
                            userId: admin.id,
                            status: 'UNREAD' as any
                        }))
                    }
                }
            });
        }

        revalidatePath('/profile');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Failed to send request' };
    }
}

export async function getUserAdRequests() {
    const session = await auth();
    if (!session?.user) return [];

    try {
        const requests = await prisma.adAccessRequest.findMany({
            where: { userId: session.user.id },
            include: {
                package: true,
                assignedKey: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return requests;
    } catch (e) {
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: Ad Access Request Management
// ═══════════════════════════════════════════════════════════════════════════════

export async function getAdminAdAccessRequests(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    const session = await auth();
    if (!session?.user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role)) {
        return { success: false, data: [], error: 'Unauthorized' };
    }

    try {
        const where = status ? { status } : {};
        const requests = await prisma.adAccessRequest.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
                package: true,
                assignedKey: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: JSON.parse(JSON.stringify(requests)) };
    } catch (e) {
        console.error('getAdminAdAccessRequests error:', e);
        return { success: false, data: [], error: 'Failed to fetch requests' };
    }
}

export async function approveAdAccessRequest(requestId: string, durationDays: number = 30, amount?: number) {
    const session = await auth();
    if (!session?.user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role)) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // Find the request with package info
        const request = await prisma.adAccessRequest.findUnique({
            where: { id: requestId },
            include: { package: true, user: true }
        });

        if (!request) return { success: false, error: 'Request not found' };
        if (request.status !== 'PENDING') return { success: false, error: 'Request is not pending' };
        if (!request.package) return { success: false, error: 'Package not found' };

        // Calculate amount based on package price and duration
        const calculatedAmount = amount ?? (request.package.pricePerDay * durationDays);

        // Generate a unique payment code
        const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
        const code = `P-${randomStr.substring(0, 4)}-${randomStr.substring(4, 8)}`;

        // Create AdPayment and link to request in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create the AdPayment code
            const adPayment = await tx.adPayment.create({
                data: {
                    code,
                    amount: calculatedAmount,
                    durationDays,
                    currency: 'LKR',
                    assignedToUserId: request.userId,
                }
            });

            // Update the request to APPROVED and link the key
            await tx.adAccessRequest.update({
                where: { id: requestId },
                data: {
                    status: 'APPROVED',
                    assignedKeyId: adPayment.id,
                    adminNote: `Approved by ${session.user.name}. Code: ${code}, Duration: ${durationDays} days.`
                }
            });

            // Notify the user
            await tx.notification.create({
                data: {
                    title: '🎉 Ad Access Approved!',
                    message: `Your request for "${request.package.name}" has been approved! Your access code is: ${code}. Valid for ${durationDays} days.`,
                    type: 'CUSTOM' as any,
                    senderId: session.user.id,
                    users: {
                        create: {
                            userId: request.userId,
                            status: 'UNREAD' as any
                        }
                    }
                }
            });

            return adPayment;
        });

        revalidatePath('/admin');
        revalidatePath('/profile');
        return { success: true, code: result.code, amount: calculatedAmount, durationDays };
    } catch (e: any) {
        console.error('approveAdAccessRequest error:', e);
        return { success: false, error: e.message || 'Failed to approve request' };
    }
}

export async function rejectAdAccessRequest(requestId: string, reason?: string) {
    const session = await auth();
    if (!session?.user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role)) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const request = await prisma.adAccessRequest.findUnique({
            where: { id: requestId },
            include: { package: true, user: true }
        });

        if (!request) return { success: false, error: 'Request not found' };
        if (request.status !== 'PENDING') return { success: false, error: 'Request is not pending' };

        await prisma.$transaction(async (tx) => {
            // Update status to REJECTED
            await tx.adAccessRequest.update({
                where: { id: requestId },
                data: {
                    status: 'REJECTED',
                    adminNote: reason || `Rejected by ${session.user.name}`
                }
            });

            // Notify the user
            await tx.notification.create({
                data: {
                    title: '❌ Ad Access Request Rejected',
                    message: `Your request for "${request.package?.name || 'Ad Package'}" was not approved.${reason ? ` Reason: ${reason}` : ''}`,
                    type: 'CUSTOM' as any,
                    senderId: session.user.id,
                    users: {
                        create: {
                            userId: request.userId,
                            status: 'UNREAD' as any
                        }
                    }
                }
            });
        });

        revalidatePath('/admin');
        revalidatePath('/profile');
        return { success: true };
    } catch (e: any) {
        console.error('rejectAdAccessRequest error:', e);
        return { success: false, error: e.message || 'Failed to reject request' };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO-EXPIRE ADS UTILITY (Can be called via cron job or scheduled task)
// ═══════════════════════════════════════════════════════════════════════════════

export async function deactivateExpiredAds() {
    try {
        const now = new Date();

        // Find and deactivate all expired ads
        const result = await prisma.sponsoredPost.updateMany({
            where: {
                isActive: true,
                status: 'APPROVED',
                endDate: {
                    not: null,
                    lt: now
                }
            },
            data: {
                isActive: false
            }
        });

        console.log(`Deactivated ${result.count} expired ads`);
        return { success: true, deactivatedCount: result.count };
    } catch (e) {
        console.error('deactivateExpiredAds error:', e);
        return { success: false, error: 'Failed to deactivate expired ads' };
    }
}
