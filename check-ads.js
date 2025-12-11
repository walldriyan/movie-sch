
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ads = await prisma.sponsoredPost.findMany({
        include: {
            payment: true,
            user: true
        }
    });

    console.log('--- Sponsored Ads Report ---');
    if (ads.length === 0) {
        console.log('No ads found.');
    } else {
        ads.forEach(ad => {
            console.log(`\nAd ID: ${ad.id}`);
            console.log(`Title: ${ad.title}`);
            console.log(`User: ${ad.user.name} (${ad.user.email})`);
            console.log(`Status: ${ad.status}`);
            console.log(`Is Active: ${ad.isActive}`);
            console.log(`Created At: ${ad.createdAt}`);

            if (ad.payment) {
                console.log(`[PAYMENT FOUND]`);
                console.log(`  - Amount: ${ad.payment.currency} ${ad.payment.amount}`);
                console.log(`  - Duration: ${ad.payment.durationDays} days`);
                console.log(`  - Status: ${ad.payment.status}`);
            } else {
                console.log(`[NO PAYMENT RECORD]`);
            }
        });
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
