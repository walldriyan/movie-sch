
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const code = `TEST-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    console.log(`Generating code...`);
    try {
        await prisma.adPayment.create({
            data: {
                code,
                amount: 1000,
                currency: 'LKR',
                durationDays: 30,
                isUsed: false
            }
        });
        console.log(`\n==========================================`);
        console.log(`CODE GENERATED: ${code}`);
        console.log(`Use this code in the payment step.`);
        console.log(`==========================================\n`);
    } catch (e) {
        console.error("Error creating code payment:", e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
