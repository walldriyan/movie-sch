
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Checking AdPayment count...");
        const count = await prisma.adPayment.count();
        console.log("Total Payments:", count);

        console.log("Fetching payments with relations...");
        const payments = await prisma.adPayment.findMany({
            include: {
                usedByUser: true,
                assignedToUser: true
            },
            take: 5
        });
        console.log("Fetched payments:", JSON.stringify(payments, null, 2));
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
