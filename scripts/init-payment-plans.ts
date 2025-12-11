
import { PrismaClient, SubscriptionInterval } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Subscription Plans...");

    const plans = [
        {
            name: "Weekly Pass",
            description: "Get full access for one week. Perfect for trying out.",
            price: 400, // LKR
            currency: "LKR",
            interval: SubscriptionInterval.WEEKLY,
            durationDays: 7,
            discountPercent: 0,
            features: ["Ad-free experience", "High Quality Downloads", "Exclusive Content"]
        },
        {
            name: "Monthly Pro",
            description: "Most popular choice. Full access for a month.",
            price: 1200, // LKR
            currency: "LKR",
            interval: SubscriptionInterval.MONTHLY,
            durationDays: 30,
            discountPercent: 10,
            features: ["Ad-free experience", "High Quality Downloads", "Exclusive Content", "Priority Support"]
        },
        {
            name: "Annual Elite",
            description: "Best value. Stay premium all year round.",
            price: 10000, // LKR (Huge discount vs 1200 * 12 = 14400)
            currency: "LKR",
            interval: SubscriptionInterval.YEARLY,
            durationDays: 365,
            discountPercent: 30, // ~30% off
            features: ["Ad-free experience", "High Quality Downloads", "Exclusive Content", "Priority Support", "Early Access"]
        }
    ];

    for (const plan of plans) {
        // Upsert based on name for now to avoid duplicates if re-run
        const existing = await prisma.subscriptionPlan.findFirst({
            where: { name: plan.name }
        });

        if (!existing) {
            await prisma.subscriptionPlan.create({ data: plan });
            console.log(`Created plan: ${plan.name}`);
        } else {
            console.log(`Plan already exists: ${plan.name}`);
        }
    }

    console.log("Done!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
