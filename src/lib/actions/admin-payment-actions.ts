
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AccessKeyType, SubscriptionInterval } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Middleware check (basic implementation for now)
async function checkSuperAdmin() {
    const session = await auth();
    // Adjust role check based on your actual Role enum (SUPER_ADMIN vs USER_ADMIN)
    if (session?.user?.role !== 'SUPER_ADMIN') {
        throw new Error("Unauthorized: Super Admin access required");
    }
    return session.user;
}

/**
 * Generate Access Keys in Bulk
 */
export async function generateAccessKeys(
    count: number,
    type: AccessKeyType,
    planId?: string,
    creditAmount?: number
) {
    try {
        await checkSuperAdmin();

        const keysToCreate = [];
        for (let i = 0; i < count; i++) {
            // Simple random code generation: XXXX-YYYY-ZZZZ
            const parts = [
                Math.random().toString(36).substring(2, 6).toUpperCase(),
                Math.random().toString(36).substring(2, 6).toUpperCase(),
                Math.random().toString(36).substring(2, 6).toUpperCase()
            ];
            const code = parts.join('-');

            keysToCreate.push({
                code,
                type,
                planId,
                creditAmount,
                createdBy: "ADMIN" // You might want to store actual admin ID
            });
        }

        // Prisma doesn't support createMany with relations efficiently for all scenarios, 
        // but for this simple table it works if we don't need the IDs back immediately 
        // or we can loop. Looping is safer to avoid code collision errors (rare but possible).

        // Using transaction for safety
        const createdKeys = await prisma.$transaction(
            keysToCreate.map(k => prisma.accessKey.create({ data: k }))
        );

        revalidatePath("/admin/payments");
        return { success: true, count: createdKeys.length };

    } catch (error: any) {
        return { error: error.message };
    }
}

/**
 * Create or Update a Subscription Plan
 */
export async function upsertSubscriptionPlan(data: {
    id?: string;
    name: string;
    price: number;
    interval: SubscriptionInterval;
    durationDays: number;
    discountPercent?: number;
    features: string[];
}) {
    try {
        await checkSuperAdmin();

        if (data.id) {
            await prisma.subscriptionPlan.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    price: data.price,
                    interval: data.interval,
                    durationDays: data.durationDays,
                    discountPercent: data.discountPercent,
                    features: data.features
                }
            });
        } else {
            await prisma.subscriptionPlan.create({
                data: {
                    name: data.name,
                    price: data.price,
                    interval: data.interval,
                    durationDays: data.durationDays,
                    discountPercent: data.discountPercent,
                    features: data.features
                }
            });
        }

        revalidatePath("/pricing");
        revalidatePath("/admin/plans");
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

/**
 * Revoke or Cancel a User's Subscription manually
 */
export async function adminCancelSubscription(subscriptionId: string) {
    try {
        await checkSuperAdmin();
        await prisma.userSubscription.update({
            where: { id: subscriptionId },
            data: { status: 'CANCELLED', endDate: new Date() } // Expire immediately
        });
        revalidatePath("/admin/users");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}
