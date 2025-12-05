/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CINEVERSE - HEALTH CHECK API ENDPOINT
 * ═══════════════════════════════════════════════════════════════════════════════
 * Production health monitoring endpoint for uptime checks and monitoring services.
 * Endpoint: GET /api/health
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRedisHealth } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HealthResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    version: string;
    environment: string;
    services: {
        database: { status: string; latency?: number };
        cache: { status: string; latency?: number };
    };
    uptime: number;
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
    const startTime = Date.now();

    // Check database
    let databaseStatus = { status: 'down', latency: undefined as number | undefined };
    try {
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        databaseStatus = { status: 'up', latency: Date.now() - dbStart };
    } catch (error) {
        console.error('[Health] Database check failed:', error);
        databaseStatus = { status: 'down', latency: undefined };
    }

    // Check cache (Redis)
    let cacheStatus = { status: 'not_configured', latency: undefined as number | undefined };
    try {
        const cacheStart = Date.now();
        const isHealthy = await checkRedisHealth();
        if (isHealthy) {
            cacheStatus = { status: 'up', latency: Date.now() - cacheStart };
        } else {
            cacheStatus = { status: 'degraded', latency: undefined };
        }
    } catch (error) {
        console.error('[Health] Cache check failed:', error);
        cacheStatus = { status: 'down', latency: undefined };
    }

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (databaseStatus.status === 'down') {
        overallStatus = 'unhealthy';
    } else if (cacheStatus.status === 'down' || cacheStatus.status === 'degraded') {
        overallStatus = 'degraded';
    }

    const response: HealthResponse = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
            database: databaseStatus,
            cache: cacheStatus,
        },
        uptime: Math.floor(process.uptime()),
    };

    // Return appropriate HTTP status code
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(response, { status: statusCode });
}
