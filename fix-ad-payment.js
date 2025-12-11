
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const adId = 'cmj1m02ku0008eqd5ieulmf9o';

    // Find the ad
    const ad = await prisma.sponsoredPost.findUnique({
        where: { id: adId },
        include: { payment: true }
    });

    if (!ad) {
        console.log('Ad not found!');
        return;
    }

    if (ad.payment) {
        console.log('Payment already exists:', ad.payment);
        return;
    }

    console.log('Creating payment for ad:', ad.title);

    // Create Payment Record
    const payment = await prisma.adPayment.create({
        data: {
            code: 'SEED_' + Date.now(),
            amount: 50.00,
            currency: 'USD',
            durationDays: 30,
            isUsed: true,
            usedAt: new Date(),
            usedByUserId: ad.userId,
        }
    });

    console.log('Payment created with ID:', payment.id);

    // Link to Ad
    const updatedAd = await prisma.sponsoredPost.update({
        where: { id: adId },
        data: {
            paymentId: payment.id
        }
    });

    console.log('Ad updated linked to payment:', updatedAd.paymentId);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
