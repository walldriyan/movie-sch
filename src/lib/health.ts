/**
 * Production Health Check Utilities
 * Enterprise-grade monitoring and diagnostics
 */

import { checkDatabaseHealth } from './prisma';
import { checkRedisHealth } from './redis';

export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    services: {
        database: ServiceHealth;
        redis: ServiceHealth;
        memory: MemoryHealth;
    };
    version: string;
    environment: string;
}

export interface ServiceHealth {
    status: 'up' | 'down' | 'unknown';
    responseTimeMs?: number;
    error?: string;
}

export interface MemoryHealth {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    usagePercent: number;
    status: 'healthy' | 'warning' | 'critical';
}

// Track server start time for uptime calculation
const startTime = Date.now();

/**
 * Get comprehensive health status of the application
 */
export async function getHealthStatus(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const uptime = Math.floor((Date.now() - startTime) / 1000);

    // Check services concurrently
    const [dbHealth, redisHealth, memoryHealth] = await Promise.all([
        checkDatabaseService(),
        checkRedisService(),
        getMemoryHealth(),
    ]);

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (dbHealth.status === 'down') {
        status = 'unhealthy';
    } else if (redisHealth.status === 'down' || memoryHealth.status === 'critical') {
        status = 'degraded';
    } else if (memoryHealth.status === 'warning') {
        status = 'degraded';
    }

    return {
        status,
        timestamp,
        uptime,
        services: {
            database: dbHealth,
            redis: redisHealth,
            memory: memoryHealth,
        },
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
    };
}

/**
 * Check database connection health
 */
async function checkDatabaseService(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
        const isHealthy = await checkDatabaseHealth();
        return {
            status: isHealthy ? 'up' : 'down',
            responseTimeMs: Date.now() - start,
        };
    } catch (error) {
        return {
            status: 'down',
            responseTimeMs: Date.now() - start,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Check Redis connection health
 */
async function checkRedisService(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
        const isHealthy = await checkRedisHealth();
        return {
            status: isHealthy ? 'up' : 'down',
            responseTimeMs: Date.now() - start,
        };
    } catch (error) {
        return {
            status: 'down',
            responseTimeMs: Date.now() - start,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Get memory usage statistics
 */
function getMemoryHealth(): MemoryHealth {
    if (typeof process === 'undefined' || !process.memoryUsage) {
        return {
            heapUsed: 0,
            heapTotal: 0,
            external: 0,
            rss: 0,
            usagePercent: 0,
            status: 'healthy',
        };
    }

    const memUsage = process.memoryUsage();
    const usagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (usagePercent > 90) {
        status = 'critical';
    } else if (usagePercent > 70) {
        status = 'warning';
    }

    return {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        usagePercent: Math.round(usagePercent * 100) / 100,
        status,
    };
}

/**
 * Lightweight ping check (for load balancers)
 */
export function getPingStatus(): { status: 'ok'; timestamp: string } {
    return {
        status: 'ok',
        timestamp: new Date().toISOString(),
    };
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics() {
    return {
        uptime: Math.floor((Date.now() - startTime) / 1000),
        memory: getMemoryHealth(),
        timestamp: new Date().toISOString(),
    };
}
