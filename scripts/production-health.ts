#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CINEVERSE - PRODUCTION HEALTH MONITORING SCRIPT
 * ═══════════════════════════════════════════════════════════════════════════════
 * Comprehensive health check for production environments.
 * Usage: npm run health OR tsx scripts/production-health.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import prisma from '../src/lib/prisma';
import { redis, checkRedisHealth } from '../src/lib/redis';
import { createClient } from '@supabase/supabase-js';

interface HealthReport {
    timestamp: string;
    environment: string;
    overallStatus: 'healthy' | 'degraded' | 'critical';
    services: ServiceHealth[];
    metrics: SystemMetrics;
    recommendations: string[];
}

interface ServiceHealth {
    name: string;
    status: 'up' | 'down' | 'degraded';
    latency?: number;
    details?: string;
    lastError?: string;
}

interface SystemMetrics {
    memory: {
        heapUsed: number;
        heapTotal: number;
        rss: number;
        percentage: number;
    };
    uptime: number;
    nodeVersion: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE HEALTH CHECKS
// ═══════════════════════════════════════════════════════════════════════════════

async function checkDatabaseHealth(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
        // Simple connectivity test
        await prisma.$queryRaw`SELECT 1`;
        const latency = Date.now() - start;

        // Additional checks for production
        const userCount = await prisma.user.count();
        const postCount = await prisma.post.count();

        return {
            name: 'Database (PostgreSQL/SQLite)',
            status: 'up',
            latency,
            details: `Connected. Users: ${userCount}, Posts: ${postCount}`,
        };
    } catch (error: any) {
        return {
            name: 'Database (PostgreSQL/SQLite)',
            status: 'down',
            lastError: error.message,
        };
    }
}

async function checkRedisHealthService(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
        if (!redis) {
            return {
                name: 'Redis (Upstash)',
                status: 'degraded',
                details: 'Not configured - caching disabled',
            };
        }

        const isHealthy = await checkRedisHealth();
        const latency = Date.now() - start;

        if (isHealthy) {
            return {
                name: 'Redis (Upstash)',
                status: 'up',
                latency,
                details: 'Cache and rate limiting operational',
            };
        } else {
            return {
                name: 'Redis (Upstash)',
                status: 'degraded',
                details: 'Connection issues - falling back to no-cache mode',
            };
        }
    } catch (error: any) {
        return {
            name: 'Redis (Upstash)',
            status: 'down',
            lastError: error.message,
        };
    }
}

async function checkSupabaseHealth(): Promise<ServiceHealth> {
    const start = Date.now();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return {
            name: 'Supabase Storage',
            status: 'degraded',
            details: 'Not configured - using local storage',
        };
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Test storage bucket access
        const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'uploads';
        const { data, error } = await supabase.storage.getBucket(bucket);

        const latency = Date.now() - start;

        if (error) {
            return {
                name: 'Supabase Storage',
                status: 'degraded',
                latency,
                details: `Bucket "${bucket}" not accessible`,
                lastError: error.message,
            };
        }

        return {
            name: 'Supabase Storage',
            status: 'up',
            latency,
            details: `Bucket "${bucket}" operational`,
        };
    } catch (error: any) {
        return {
            name: 'Supabase Storage',
            status: 'down',
            lastError: error.message,
        };
    }
}

async function checkAuthHealth(): Promise<ServiceHealth> {
    const authSecret = process.env.AUTH_SECRET;
    const authUrl = process.env.AUTH_URL;

    const issues: string[] = [];

    if (!authSecret) {
        issues.push('AUTH_SECRET not set');
    } else if (authSecret.length < 32) {
        issues.push('AUTH_SECRET too short');
    }

    if (!authUrl) {
        issues.push('AUTH_URL not set');
    } else if (authUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
        issues.push('AUTH_URL still using localhost');
    }

    if (issues.length > 0) {
        return {
            name: 'Authentication (NextAuth)',
            status: issues.length > 1 ? 'down' : 'degraded',
            details: issues.join(', '),
        };
    }

    return {
        name: 'Authentication (NextAuth)',
        status: 'up',
        details: 'Properly configured',
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM METRICS
// ═══════════════════════════════════════════════════════════════════════════════

function getSystemMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();

    return {
        memory: {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
            rss: Math.round(memUsage.rss / 1024 / 1024),
            percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
        },
        uptime: Math.floor(process.uptime()),
        nodeVersion: process.version,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECOMMENDATIONS ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

function generateRecommendations(services: ServiceHealth[], metrics: SystemMetrics): string[] {
    const recommendations: string[] = [];

    // Check for critical services
    const criticalDown = services.filter((s) =>
        s.status === 'down' && s.name.includes('Database')
    );
    if (criticalDown.length > 0) {
        recommendations.push('🚨 CRITICAL: Database is down. Check connection string and credentials.');
    }

    // Memory recommendations
    if (metrics.memory.percentage > 90) {
        recommendations.push('⚠️ Memory usage critical (>90%). Consider scaling or optimizing.');
    } else if (metrics.memory.percentage > 75) {
        recommendations.push('💡 Memory usage high (>75%). Monitor closely.');
    }

    // Service-specific recommendations
    const redisService = services.find((s) => s.name.includes('Redis'));
    if (redisService?.status === 'degraded') {
        recommendations.push('💡 Redis not configured. Enable for better performance with caching.');
    }

    const supabaseService = services.find((s) => s.name.includes('Supabase'));
    if (supabaseService?.status === 'degraded') {
        recommendations.push('💡 Supabase storage not configured. Required for production file uploads.');
    }

    // Latency recommendations
    const slowServices = services.filter((s) => s.latency && s.latency > 500);
    if (slowServices.length > 0) {
        recommendations.push(
            `⚠️ High latency detected on: ${slowServices.map((s) => s.name).join(', ')}`
        );
    }

    if (recommendations.length === 0) {
        recommendations.push('✅ All systems operating normally. No immediate actions required.');
    }

    return recommendations;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════════

async function runHealthCheck(): Promise<HealthReport> {
    console.log('\n═══════════════════════════════════════════════════════════════════════════════');
    console.log('                    🏥 CINEVERSE PRODUCTION HEALTH CHECK                       ');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    const timestamp = new Date().toISOString();
    const environment = process.env.NODE_ENV || 'development';

    console.log(`📅 Timestamp: ${timestamp}`);
    console.log(`🌍 Environment: ${environment}\n`);

    // Run all health checks in parallel
    console.log('🔍 Running service health checks...\n');

    const [database, redisHealth, supabase, auth] = await Promise.all([
        checkDatabaseHealth(),
        checkRedisHealthService(),
        checkSupabaseHealth(),
        checkAuthHealth(),
    ]);

    const services = [database, redisHealth, supabase, auth];

    // Get system metrics
    const metrics = getSystemMetrics();

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    const downServices = services.filter((s) => s.status === 'down');
    const degradedServices = services.filter((s) => s.status === 'degraded');

    if (downServices.some((s) => s.name.includes('Database'))) {
        overallStatus = 'critical';
    } else if (downServices.length > 0) {
        overallStatus = 'critical';
    } else if (degradedServices.length > 1 || metrics.memory.percentage > 90) {
        overallStatus = 'degraded';
    }

    // Generate recommendations
    const recommendations = generateRecommendations(services, metrics);

    // Print results
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                              📊 SERVICE STATUS                                ');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    services.forEach((service) => {
        const statusIcon = service.status === 'up' ? '✅' : service.status === 'degraded' ? '⚠️' : '❌';
        console.log(`${statusIcon} ${service.name}`);
        console.log(`   Status: ${service.status.toUpperCase()}`);
        if (service.latency) console.log(`   Latency: ${service.latency}ms`);
        if (service.details) console.log(`   Details: ${service.details}`);
        if (service.lastError) console.log(`   Error: ${service.lastError}`);
        console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                              💾 SYSTEM METRICS                                ');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    const memoryIcon = metrics.memory.percentage > 90 ? '🔴' : metrics.memory.percentage > 75 ? '🟡' : '🟢';
    console.log(`${memoryIcon} Memory Usage: ${metrics.memory.heapUsed}MB / ${metrics.memory.heapTotal}MB (${metrics.memory.percentage}%)`);
    console.log(`   RSS: ${metrics.memory.rss}MB`);
    console.log(`   Node.js: ${metrics.nodeVersion}`);
    console.log(`   Uptime: ${Math.floor(metrics.uptime / 60)} minutes\n`);

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                              💡 RECOMMENDATIONS                               ');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    recommendations.forEach((rec) => console.log(`   ${rec}`));
    console.log('');

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    const overallIcon = overallStatus === 'healthy' ? '✅' : overallStatus === 'degraded' ? '⚠️' : '🚨';
    console.log(`                    ${overallIcon} OVERALL STATUS: ${overallStatus.toUpperCase()}`);
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    return {
        timestamp,
        environment,
        overallStatus,
        services,
        metrics,
        recommendations,
    };
}

// Execute
runHealthCheck()
    .then(async (report) => {
        await prisma.$disconnect();
        process.exit(report.overallStatus === 'critical' ? 1 : 0);
    })
    .catch(async (error) => {
        console.error('Health check failed:', error);
        await prisma.$disconnect();
        process.exit(1);
    });
