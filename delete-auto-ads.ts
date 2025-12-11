// Delete auto-seeded ads (userId is null)
import prisma from './src/lib/prisma';

async function deleteAutoAds() {
    console.log('Deleting auto-seeded ads (userId: null)...');

    const deleted = await prisma.sponsoredPost.deleteMany({
        where: { userId: null }
    });

    console.log(`✅ Deleted ${deleted.count} auto-seeded ads`);

    const remaining = await prisma.sponsoredPost.findMany({
        select: { id: true, title: true, userId: true, status: true, isActive: true }
    });

    console.log(`\nRemaining user ads: ${remaining.length}`);
    remaining.forEach(a => {
        console.log(`- ${a.title} | userId: ${a.userId} | status: ${a.status} | active: ${a.isActive}`);
    });
}

deleteAutoAds()
    .then(() => process.exit(0))
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
