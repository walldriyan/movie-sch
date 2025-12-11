// Debug script to check ads in database
import prisma from './src/lib/prisma';

async function debugAds() {
    console.log('=== ALL SPONSORED POSTS ===');
    const allAds = await prisma.sponsoredPost.findMany({
        orderBy: { createdAt: 'desc' }
    });

    console.log(`Total ads in DB: ${allAds.length}`);
    allAds.forEach((ad, i) => {
        console.log(`\n[${i + 1}] ${ad.title}`);
        console.log(`   ID: ${ad.id}`);
        console.log(`   Status: ${ad.status}`);
        console.log(`   isActive: ${ad.isActive}`);
        console.log(`   userId: ${ad.userId || 'NULL'}`);
        console.log(`   createdAt: ${ad.createdAt}`);
    });

    console.log('\n=== APPROVED & ACTIVE ADS (should show on home) ===');
    const activeApproved = await prisma.sponsoredPost.findMany({
        where: { isActive: true, status: 'APPROVED' },
        orderBy: { priority: 'desc' }
    });

    console.log(`Approved & Active: ${activeApproved.length}`);
    activeApproved.forEach((ad, i) => {
        console.log(`[${i + 1}] ${ad.title} (priority: ${ad.priority})`);
    });
}

debugAds()
    .then(() => process.exit(0))
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
