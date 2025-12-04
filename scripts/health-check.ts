import prisma from '../src/lib/prisma';
import { redis, checkRedisHealth } from '../src/lib/redis';

interface HealthCheckResult {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    checks: {
        database: { status: string; latency?: number; error?: string };
        redis: { status: string; latency?: number; error?: string };
        memory: {
            status: string;
            heapUsed: string;
            heapTotal: string;
            rss: string;
            external: string;
        };
        env: { status: string; missing?: string[] };
    };
    uptime: number;
}

async function checkDatabase(): Promise<{ status: string; latency?: number; error?: string }> {
    const start = Date.now();
    try {
        await prisma.$queryRaw`SELECT 1`;
        const latency = Date.now() - start;
        return { status: 'healthy', latency };
    } catch (error: any) {
        return { status: 'unhealthy', error: error.message };
    }
}

async function checkRedis(): Promise<{ status: string; latency?: number; error?: string }> {
    const start = Date.now();
    try {
        const isHealthy = await checkRedisHealth();
        const latency = Date.now() - start;
        return {
            status: isHealthy ? 'healthy' : 'unavailable',
            latency: isHealthy ? latency : undefined
        };
    } catch (error: any) {
        return { status: 'unavailable', error: error.message };
    }
}

function checkMemory(): {
    status: string;
    heapUsed: string;
    heapTotal: string;
    rss: string;
    external: string;
} {
    const memUsage = process.memoryUsage();
    const formatBytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

    // Warn if heap usage > 80%
    const heapPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    const status = heapPercentage > 90 ? 'critical' : heapPercentage > 80 ? 'warning' : 'healthy';

    return {
        status,
        heapUsed: formatBytes(memUsage.heapUsed),
        heapTotal: formatBytes(memUsage.heapTotal),
        rss: formatBytes(memUsage.rss),
        external: formatBytes(memUsage.external),
    };
}

function checkEnvVariables(): { status: string; missing?: string[] } {
    const requiredEnvVars = [
        'DATABASE_URL',
        'NEXTAUTH_URL',
        'NEXTAUTH_SECRET',
    ];

    const optionalButRecommended = [
        'UPSTASH_REDIS_REST_URL',
        'UPSTASH_REDIS_REST_TOKEN',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
    ];

    const missing = requiredEnvVars.filter(key => !process.env[key]);
    const missingOptional = optionalButRecommended.filter(key => !process.env[key]);

    if (missing.length > 0) {
        return { status: 'critical', missing };
    }

    if (missingOptional.length > 0) {
        return { status: 'warning', missing: missingOptional };
    }

    return { status: 'healthy' };
}

async function runHealthCheck(): Promise<HealthCheckResult> {
    console.log('🔍 Running health checks...\n');

    const [dbCheck, redisCheck] = await Promise.all([
        checkDatabase(),
        checkRedis(),
    ]);

    const memoryCheck = checkMemory();
    const envCheck = checkEnvVariables();

    const checks = {
        database: dbCheck,
        redis: redisCheck,
        memory: memoryCheck,
        env: envCheck,
    };

    // Determine overall status
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    if (dbCheck.status === 'unhealthy' || envCheck.status === 'critical') {
        status = 'unhealthy';
    } else if (
        redisCheck.status === 'unavailable' ||
        memoryCheck.status === 'warning' ||
        envCheck.status === 'warning'
    ) {
        status = 'degraded';
    }

    const result: HealthCheckResult = {
        status,
        timestamp: new Date().toISOString(),
        checks,
        uptime: process.uptime(),
    };

    // Print results
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 HEALTH CHECK RESULTS`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const statusEmoji = status === 'healthy' ? '✅' : status === 'degraded' ? '⚠️' : '❌';
    console.log(`Overall Status: ${statusEmoji} ${status.toUpperCase()}\n`);

    console.log('📦 Database:');
    console.log(`   Status: ${dbCheck.status === 'healthy' ? '✅' : '❌'} ${dbCheck.status}`);
    if (dbCheck.latency) console.log(`   Latency: ${dbCheck.latency}ms`);
    if (dbCheck.error) console.log(`   Error: ${dbCheck.error}`);

    console.log('\n🔴 Redis:');
    console.log(`   Status: ${redisCheck.status === 'healthy' ? '✅' : '⚠️'} ${redisCheck.status}`);
    if (redisCheck.latency) console.log(`   Latency: ${redisCheck.latency}ms`);
    if (redisCheck.error) console.log(`   Note: ${redisCheck.error}`);

    console.log('\n💾 Memory:');
    console.log(`   Status: ${memoryCheck.status === 'healthy' ? '✅' : '⚠️'} ${memoryCheck.status}`);
    console.log(`   Heap Used: ${memoryCheck.heapUsed}`);
    console.log(`   Heap Total: ${memoryCheck.heapTotal}`);
    console.log(`   RSS: ${memoryCheck.rss}`);

    console.log('\n🔐 Environment:');
    console.log(`   Status: ${envCheck.status === 'healthy' ? '✅' : envCheck.status === 'warning' ? '⚠️' : '❌'} ${envCheck.status}`);
    if (envCheck.missing) console.log(`   Missing: ${envCheck.missing.join(', ')}`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⏱️  Uptime: ${Math.floor(result.uptime)}s`);
    console.log(`📅 Timestamp: ${result.timestamp}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return result;
}

// Run health check
runHealthCheck()
    .then(async (result) => {
        await prisma.$disconnect();
        process.exit(result.status === 'unhealthy' ? 1 : 0);
    })
    .catch(async (error) => {
        console.error('Health check failed:', error);
        await prisma.$disconnect();
        process.exit(1);
    });
