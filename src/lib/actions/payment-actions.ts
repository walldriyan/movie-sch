
"use server";

import { auth } from "@/auth"; // Adjust import based on your project
import { prisma } from "@/lib/prisma";
import { PaymentService } from "@/lib/payment/service";
import { revalidatePath } from "next/cache";

export async function redeemKeyAction(code: string) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return { error: "Authentication required" };
    }

    try {
        const result = await PaymentService.redeemAccessKey(session.user.id, code);
        revalidatePath("/profile");
        revalidatePath("/pricing");
        return { success: true, message: "Code redeemed successfully!", data: result };
    } catch (error: any) {
        return { error: error.message || "Failed to redeem code" };
    }
}

export async function getSubscriptionPlans() {
    // Fetch active plans to show on the pricing page
    const plans = await prisma.subscriptionPlan.findMany({
        where: {
            isArchived: false,
        },
        orderBy: { price: 'asc' }
    });
    return plans;
}

export async function getUserPaymentHistory() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return await prisma.paymentRecord.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
            subscription: {
                include: { plan: true }
            },
            accessKey: true
        }
    });
}

export async function getUserActiveSubscription() {
    const session = await auth();
    if (!session?.user?.id) return null;

    return await prisma.userSubscription.findFirst({
        where: {
            userId: session.user.id,
            status: 'ACTIVE',
            endDate: { gt: new Date() }
        },
        include: { plan: true },
        orderBy: { endDate: 'desc' }
    });
}

// USER: Request a subscription (Pending Approval)
export async function requestSubscription(planId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Authentication required" };

    try {
        // Check if user has pending request
        const existingPending = await prisma.userSubscription.findFirst({
            where: {
                userId: session.user.id,
                status: 'PENDING'
            }
        });

        if (existingPending) {
            return { success: false, error: "You already have a pending request." };
        }

        // Create pending subscription
        await prisma.userSubscription.create({
            data: {
                userId: session.user.id,
                planId: planId,
                status: 'PENDING',
                startDate: new Date(),
                endDate: null, // Will be set on approval
            }
        });

        revalidatePath("/profile");
        return { success: true, message: "Request sent to admin!" };
    } catch (error) {
        console.error("Request Sub Error:", error);
        return { success: false, error: "Failed to send request" };
    }
}

// USER: Cancel a pending request
export async function cancelSubscriptionRequest() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Authentication required" };

    try {
        await prisma.userSubscription.deleteMany({
            where: {
                userId: session.user.id,
                status: 'PENDING'
            }
        });

        revalidatePath("/profile");
        return { success: true, message: "Request cancelled." };
    } catch (error) {
        return { success: false, error: "Failed to cancel request" };
    }
}

// ADMIN: Get all pending requests
export async function getAllSubscriptionRequests() {
    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') return [];

    return await prisma.userSubscription.findMany({
        where: { status: 'PENDING' },
        include: {
            user: true,
            plan: true
        },
        orderBy: { createdAt: 'asc' }
    });
}

// ADMIN: Approve Request
export async function approveSubscriptionRequest(subscriptionId: string) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') return { success: false, error: "Unauthorized" };

    try {
        const sub = await prisma.userSubscription.findUnique({
            where: { id: subscriptionId },
            include: { plan: true }
        });

        if (!sub || !sub.plan) return { success: false, error: "Subscription or plan not found" };

        const now = new Date();
        const endDate = new Date();
        endDate.setDate(now.getDate() + sub.plan.durationDays);

        await prisma.userSubscription.update({
            where: { id: subscriptionId },
            data: {
                status: 'ACTIVE',
                startDate: now,
                endDate: endDate
            }
        });

        // Also update User accountType to PREMIUM as a fallback
        await prisma.user.update({
            where: { id: sub.userId },
            data: { accountType: 'PREMIUM' }
        });

        // Create Payment Record for history
        const payment = await prisma.paymentRecord.create({
            data: {
                userId: sub.userId,
                amount: sub.plan.price,
                currency: "LKR",
                status: "COMPLETED",
                method: "ADMIN_GRANT",
                type: "SUBSCRIPTION"
            }
        });

        await prisma.userSubscription.update({
            where: { id: subscriptionId },
            data: { paymentId: payment.id }
        });

        revalidatePath("/admin");
        return { success: true, message: "Subscription Approved" };
    } catch (error) {
        return { success: false, error: "Approval failed" };
    }
}

// ADMIN: Reject Request
export async function rejectSubscriptionRequest(subscriptionId: string) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') return { success: false, error: "Unauthorized" };

    try {
        await prisma.userSubscription.delete({
            where: { id: subscriptionId }
        });

        revalidatePath("/admin");
        return { success: true, message: "Request Rejected" };
    } catch (error) {
        return { success: false, error: "Rejection failed" };
    }
}
