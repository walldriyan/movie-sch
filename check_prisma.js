
const prisma = require('./src/lib/prisma').default;

async function check() {
    console.log('Checking prisma.playlist...');
    if (prisma.playlist) {
        console.log('prisma.playlist exists!');
    } else {
        console.error('prisma.playlist DOES NOT exist');
    }
}

check().catch(console.error);
