/**
 * Health Check Script
 * Run with: npm run health-check
 */

import { checkDatabaseHealth } from '../src/lib/prisma';
import { checkRedisHealth } from '../src/lib/redis';

interface HealthStatus {
    service: string;
    status: 'healthy' | 'unhealthy' | 'degraded';
    message: string;
    responseTime?: number;
}

async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
    const start = Date.now();
    const result = await fn();
    return { result, time: Date.now() - start };
}

async function checkHealth(): Promise<void> {
    console.log('\n🔍 Running Health Checks...\n');
    console.log('='.repeat(50));

    const results: HealthStatus[] = [];

    // Check Database
    console.log('\n📊 Database (Prisma)...');
    try {
        const { result: dbHealthy, time } = await measureTime(checkDatabaseHealth);
        results.push({
            service: 'Database',
            status: dbHealthy ? 'healthy' : 'unhealthy',
            message: dbHealthy ? 'Connected successfully' : 'Connection failed',
            responseTime: time,
        });
        console.log(`   Status: ${dbHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
        console.log(`   Response Time: ${time}ms`);
    } catch (error) {
        results.push({
            service: 'Database',
            status: 'unhealthy',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
        console.log(`   Status: ❌ Unhealthy`);
        console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Check Redis
    console.log('\n🔴 Redis (Upstash)...');
    try {
        const { result: redisHealthy, time } = await measureTime(checkRedisHealth);
        results.push({
            service: 'Redis',
            status: redisHealthy ? 'healthy' : 'degraded',
            message: redisHealthy ? 'Connected successfully' : 'Not configured or connection failed',
            responseTime: time,
        });
        console.log(`   Status: ${redisHealthy ? '✅ Healthy' : '⚠️ Degraded'}`);
        console.log(`   Response Time: ${time}ms`);
    } catch (error) {
        results.push({
            service: 'Redis',
            status: 'degraded',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
        console.log(`   Status: ⚠️ Degraded`);
        console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Check Environment Variables
    console.log('\n🔐 Environment Variables...');
    const requiredEnvVars = [
        'DATABASE_URL',
        'AUTH_SECRET',
    ];

    const optionalEnvVars = [
        'AUTH_GOOGLE_ID',
        'AUTH_GOOGLE_SECRET',
        'UPSTASH_REDIS_REST_URL',
        'UPSTASH_REDIS_REST_TOKEN',
        'SENTRY_DSN',
    ];

    let envHealthy = true;
    for (const envVar of requiredEnvVars) {
        const exists = !!process.env[envVar];
        if (!exists) envHealthy = false;
        console.log(`   ${envVar}: ${exists ? '✅' : '❌ Missing'}`);
    }

    console.log('\n   Optional:');
    for (const envVar of optionalEnvVars) {
        const exists = !!process.env[envVar];
        console.log(`   ${envVar}: ${exists ? '✅' : '⚪ Not set'}`);
    }

    results.push({
        service: 'Environment',
        status: envHealthy ? 'healthy' : 'unhealthy',
        message: envHealthy ? 'All required variables set' : 'Missing required variables',
    });

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('\n📋 Summary:\n');

    const healthyCount = results.filter(r => r.status === 'healthy').length;
    const degradedCount = results.filter(r => r.status === 'degraded').length;
    const unhealthyCount = results.filter(r => r.status === 'unhealthy').length;

    console.log(`   ✅ Healthy: ${healthyCount}`);
    console.log(`   ⚠️ Degraded: ${degradedCount}`);
    console.log(`   ❌ Unhealthy: ${unhealthyCount}`);

    const overallStatus = unhealthyCount > 0 ? 'UNHEALTHY' : degradedCount > 0 ? 'DEGRADED' : 'HEALTHY';
    console.log(`\n   Overall Status: ${overallStatus}\n`);

    // Exit with appropriate code
    process.exit(unhealthyCount > 0 ? 1 : 0);
}

checkHealth().catch(console.error);
