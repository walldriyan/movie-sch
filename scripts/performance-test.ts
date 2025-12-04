import prisma from '../src/lib/prisma';

interface PerformanceResult {
    name: string;
    avgTime: number;
    minTime: number;
    maxTime: number;
    iterations: number;
    status: 'fast' | 'acceptable' | 'slow';
}

async function measurePerformance<T>(
    name: string,
    fn: () => Promise<T>,
    iterations: number = 10
): Promise<PerformanceResult> {
    const times: number[] = [];

    // Warm up
    await fn();

    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await fn();
        const end = performance.now();
        times.push(end - start);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    // Determine status based on average time
    let status: 'fast' | 'acceptable' | 'slow';
    if (avgTime < 50) status = 'fast';
    else if (avgTime < 200) status = 'acceptable';
    else status = 'slow';

    return { name, avgTime, minTime, maxTime, iterations, status };
}

async function runPerformanceTests(): Promise<void> {
    console.log('🚀 Running Performance Tests...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const results: PerformanceResult[] = [];

    // Test 1: Simple database query
    results.push(
        await measurePerformance(
            'Simple Query (SELECT 1)',
            async () => {
                await prisma.$queryRaw`SELECT 1`;
            }
        )
    );

    // Test 2: User count query
    results.push(
        await measurePerformance(
            'User Count Query',
            async () => {
                await prisma.user.count();
            }
        )
    );

    // Test 3: Posts with relations
    results.push(
        await measurePerformance(
            'Posts with Author (10 items)',
            async () => {
                await prisma.post.findMany({
                    take: 10,
                    include: { author: true },
                });
            }
        )
    );

    // Test 4: Posts with full relations
    results.push(
        await measurePerformance(
            'Posts with Full Relations (5 items)',
            async () => {
                await prisma.post.findMany({
                    take: 5,
                    include: {
                        author: true,
                        reviews: { take: 3 },
                        _count: { select: { likedBy: true } },
                    },
                });
            }
        )
    );

    // Test 5: Search-like query
    results.push(
        await measurePerformance(
            'Posts Search (title contains)',
            async () => {
                await prisma.post.findMany({
                    where: {
                        title: { contains: 'a' },
                        status: 'PUBLISHED',
                    },
                    take: 10,
                });
            }
        )
    );

    // Print results
    console.log('\n📊 PERFORMANCE TEST RESULTS\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (const result of results) {
        const statusEmoji = result.status === 'fast' ? '🟢' : result.status === 'acceptable' ? '🟡' : '🔴';
        console.log(`${statusEmoji} ${result.name}`);
        console.log(`   Average: ${result.avgTime.toFixed(2)}ms`);
        console.log(`   Min: ${result.minTime.toFixed(2)}ms | Max: ${result.maxTime.toFixed(2)}ms`);
        console.log(`   Iterations: ${result.iterations}`);
        console.log('');
    }

    // Summary
    const slowQueries = results.filter(r => r.status === 'slow');
    const acceptableQueries = results.filter(r => r.status === 'acceptable');
    const fastQueries = results.filter(r => r.status === 'fast');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   🟢 Fast (<50ms): ${fastQueries.length}`);
    console.log(`   🟡 Acceptable (50-200ms): ${acceptableQueries.length}`);
    console.log(`   🔴 Slow (>200ms): ${slowQueries.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (slowQueries.length > 0) {
        console.log('⚠️  Warning: Some queries are slow. Consider optimizing:');
        slowQueries.forEach(q => console.log(`   - ${q.name}`));
    }
}

runPerformanceTests()
    .then(async () => {
        await prisma.$disconnect();
        process.exit(0);
    })
    .catch(async (error) => {
        console.error('Performance test failed:', error);
        await prisma.$disconnect();
        process.exit(1);
    });
