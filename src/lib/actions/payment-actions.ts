
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
