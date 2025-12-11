'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ROLES } from '@/lib/permissions';

// ==========================================
// 1. DASHBOARD OVERVIEW STATS
// ==========================================
export async function getAdminPaymentStats() {
    const session = await auth();
    if (session?.user?.role !== ROLES.SUPER_ADMIN) throw new Error('Unauthorized');

    const totalRevenue = await prisma.paymentRecord.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' }
    });

    const activeSubs = await prisma.userSubscription.count({
        where: { status: 'ACTIVE', endDate: { gt: new Date() } }
    });

    const activeAds = await prisma.sponsoredPost.count({
        where: { status: 'APPROVED', isActive: true }
    });

    const recentTransactions = await prisma.paymentRecord.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true, image: true } } }
    });

    return {
        revenue: totalRevenue._sum.amount || 0,
        activeSubs,
        activeAds,
        recentTransactions
    };
}

// ==========================================
// 2. TRANSACTION HISTORY (With Filters)
// ==========================================
export async function getAllTransactions(page = 1, limit = 20, query = '') {
    const session = await auth();
    if (session?.user?.role !== ROLES.SUPER_ADMIN) throw new Error('Unauthorized');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (query) {
        where.OR = [
            { user: { email: { contains: query } } },
            { user: { name: { contains: query } } },
            { id: { contains: query } }
        ];
    }

    const [transactions, total] = await Promise.all([
        prisma.paymentRecord.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, email: true, image: true } },
                subscription: { include: { plan: true } },
                sponsoredPost: true,
            }
        }),
        prisma.paymentRecord.count({ where })
    ]);

    return { transactions, totalPages: Math.ceil(total / limit) };
}

// ==========================================
// 3. SUBSCRIPTION MANAGEMENT
// ==========================================
export async function getAllSubscriptions(page = 1, limit = 20, query = '') {
    const session = await auth();
    if (session?.user?.role !== ROLES.SUPER_ADMIN) throw new Error('Unauthorized');

    const skip = (page - 1) * limit;
    const where: any = {
        status: 'ACTIVE',
        endDate: { gt: new Date() }
    };

    if (query) {
        where.user = {
            OR: [
                { email: { contains: query } },
                { name: { contains: query } }
            ]
        };
    }

    const [subscriptions, total] = await Promise.all([
        prisma.userSubscription.findMany({
            where,
            skip,
            take: limit,
            orderBy: { endDate: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
                plan: true
            }
        }),
        prisma.userSubscription.count({ where })
    ]);

    return { subscriptions, totalPages: Math.ceil(total / limit) };
}

// Manually Add/Edit Subscription for User
export async function upsertManualSubscription(userId: string, planId: string, customEndDate?: Date) {
    const session = await auth();
    if (session?.user?.role !== ROLES.SUPER_ADMIN) throw new Error('Unauthorized');

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');

    // Calculate end date if not provided
    const endDate = customEndDate || new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Create a dummy payment record for tracking
    const payment = await prisma.paymentRecord.create({
        data: {
            userId,
            amount: 0,
            currency: 'MANUAL',
            method: 'MANUAL_KEY', // Using existing enum or adding ADMIN_OVERRIDE if enum allows
            type: 'SUBSCRIPTION',
            status: 'COMPLETED'
        }
    });

    // Create or Update Subscription
    // Check existing active sub
    const existing = await prisma.userSubscription.findFirst({
        where: { userId, status: 'ACTIVE' }
    });

    if (existing) {
        await prisma.userSubscription.update({
            where: { id: existing.id },
            data: {
                status: 'CANCELLED', // Mark old as cancelled or replace
                endDate: new Date()
            }
        });
    }

    await prisma.userSubscription.create({
        data: {
            userId,
            planId,
            status: 'ACTIVE',
            startDate: new Date(),
            endDate,
            paymentId: payment.id
        }
    });

    revalidatePath('/admin/payments');
    return { success: true };
}

export async function cancelUserSubscription(subId: string) {
    const session = await auth();
    if (session?.user?.role !== ROLES.SUPER_ADMIN) throw new Error('Unauthorized');

    await prisma.userSubscription.update({
        where: { id: subId },
        data: { status: 'CANCELLED', endDate: new Date() }
    });

    revalidatePath('/admin/payments');
    return { success: true };
}

// ==========================================
// 4. PLAN MANAGEMENT (Price, Days, etc)
// ==========================================
export async function getSubscriptionPlans() {
    return await prisma.subscriptionPlan.findMany({
        orderBy: { price: 'asc' }
    });
}

export async function upsertSubscriptionPlan(data: { id?: string, name: string, price: number, durationDays: number, features: string[], interval: string }) {
    const session = await auth();
    if (session?.user?.role !== ROLES.SUPER_ADMIN) throw new Error('Unauthorized');

    if (data.id) {
        await prisma.subscriptionPlan.update({
            where: { id: data.id },
            data: {
                name: data.name,
                price: data.price,
                durationDays: data.durationDays,
                features: data.features,
                interval: data.interval as any
            }
        });
    } else {
        await prisma.subscriptionPlan.create({
            data: {
                name: data.name,
                price: data.price,
                durationDays: data.durationDays,
                features: data.features,
                interval: data.interval as any,
                currency: 'LKR'
            }
        });
    }

    revalidatePath('/admin/payments');
    return { success: true };
}

export async function deleteSubscriptionPlan(id: string) {
    const session = await auth();
    if (session?.user?.role !== ROLES.SUPER_ADMIN) throw new Error('Unauthorized');

    // Soft delete usually better, but schema has isArchived
    await prisma.subscriptionPlan.update({
        where: { id },
        data: { isArchived: true }
    });

    revalidatePath('/admin/payments');
    return { success: true };
}
