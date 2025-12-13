
import { prisma } from "@/lib/prisma";
import {
    SubscriptionInterval,
    SubscriptionStatus,
    PaymentMethod,
    PaymentStatus,
    PaymentType,
    AccessKeyType
} from "@prisma/client";
import { startOfDay, addDays, addMonths, addYears, isAfter } from "date-fns";

export class PaymentService {

    /**
     * Calculates the end date based on interval and count
     */
    private static calculateEndDate(startDate: Date, interval: SubscriptionInterval, durationDays: number): Date {
        switch (interval) {
            case 'WEEKLY':
                return addDays(startDate, durationDays || 7);
            case 'MONTHLY':
                return addMonths(startDate, 1); // Or use durationDays if strictly 30
            case 'YEARLY':
                return addYears(startDate, 1);
            case 'LIFETIME':
                return addYears(startDate, 100); // Functional infinity
            default:
                return addDays(startDate, durationDays);
        }
    }

    /**
     * Grant a user a subscription (Pro Access)
     * This handles extending existing subscriptions as well.
     */
    static async grantSubscription(
        userId: string,
        planId: string,
        paymentDetails: {
            amount: number;
            currency?: string;
            method: PaymentMethod;
            referenceId?: string;
            accessKeyId?: string;
            gatewayName?: string;
            metadata?: any;
        }
    ) {
        // 1. Fetch the plan details
        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId }
        });

        if (!plan) throw new Error("Invalid Subscription Plan");

        // 2. Check for existing active subscription
        const existingSub = await prisma.userSubscription.findFirst({
            where: {
                userId,
                status: 'ACTIVE',
                endDate: { gt: new Date() }
            },
            orderBy: { endDate: 'desc' }
        });

        const now = new Date();
        // If they have an active sub, start the new one after the current one ends
        const startDate = existingSub?.endDate && isAfter(existingSub.endDate, now)
            ? existingSub.endDate
            : now;

        const endDate = this.calculateEndDate(startDate, plan.interval, plan.durationDays);

        // 3. Create the Database Transaction
        // We create the PaymentRecord AND the UserSubscription atomically
        return await prisma.$transaction(async (tx) => {

            // Create Payment Record
            const payment = await tx.paymentRecord.create({
                data: {
                    userId,
                    amount: paymentDetails.amount,
                    currency: paymentDetails.currency || "LKR",
                    method: paymentDetails.method,
                    status: PaymentStatus.COMPLETED,
                    type: PaymentType.SUBSCRIPTION,
                    accessKeyId: paymentDetails.accessKeyId,
                    gatewayRefId: paymentDetails.referenceId,
                    gatewayName: paymentDetails.gatewayName,
                    metadata: paymentDetails.metadata || {},
                }
            });

            // Create Subscription linked to Payment
            const subscription = await tx.userSubscription.create({
                data: {
                    userId,
                    planId: plan.id,
                    status: SubscriptionStatus.ACTIVE,
                    startDate,
                    endDate,
                    paymentId: payment.id,
                    autoRenew: false // Default to false, gateway can update later
                }
            });

            // Update User to be Pro (redundant but useful for fast simple checks if we keep the boolean flag/enum)
            // The schema currently uses `accountType`, let's update that to keep things consistent
            await tx.user.update({
                where: { id: userId },
                data: {
                    accountType: 'PREMIUM', // Assuming enum matches
                    subscriptionEndDate: endDate
                }
            });

            return { payment, subscription };
        });
    }

    /**
     * Redeem an access key (The core "One Key" function)
     */
    static async redeemAccessKey(userId: string, code: string) {
        const key = await prisma.accessKey.findUnique({
            where: { code },
            include: { plan: true }
        });

        if (!key) throw new Error("Invalid Access Code");
        if (key.isUsed) throw new Error("This code has already been used");
        if (key.expiresAt && isAfter(new Date(), key.expiresAt)) {
            throw new Error("This code has expired");
        }
        if (key.assignedToUserId && key.assignedToUserId !== userId) {
            throw new Error("This code is reserved for another user");
        }

        // Logic based on Key Type
        if (key.type === AccessKeyType.SUBSCRIPTION) {
            if (!key.planId) throw new Error("Configuration Error: Key has no plan assigned");

            // Use the plan's price as the "value" of this translation
            const result = await this.grantSubscription(userId, key.planId, {
                amount: key.plan?.price || 0,
                method: PaymentMethod.MANUAL_KEY,
                accessKeyId: key.id
            });

            // Mark key as used
            await prisma.accessKey.update({
                where: { id: key.id },
                data: {
                    isUsed: true,
                    usedAt: new Date(),
                    usedByUserId: userId
                }
            });

            return { success: true, type: 'SUBSCRIPTION', data: result };

        } else if (key.type === AccessKeyType.AD_CAMPAIGN) {

            const payment = await prisma.paymentRecord.create({
                data: {
                    userId,
                    amount: key.creditAmount || 0,
                    method: PaymentMethod.MANUAL_KEY,
                    type: PaymentType.AD_CAMPAIGN,
                    status: PaymentStatus.COMPLETED,
                    accessKeyId: key.id
                }
            });

            await prisma.accessKey.update({
                where: { id: key.id },
                data: {
                    isUsed: true,
                    usedAt: new Date(),
                    usedByUserId: userId
                }
            });

            // Increment User Balance
            if (key.creditAmount && key.creditAmount > 0) {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        adBalance: { increment: key.creditAmount }
                    }
                });
            }

            return { success: true, type: 'AD_CAMPAIGN', data: payment };
        }
    }
}
