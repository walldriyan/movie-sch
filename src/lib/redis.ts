import { Redis } from '@upstash/redis';

// Extend NodeJS global type
declare global {
  // eslint-disable-next-line no-var
  var redis: Redis | null;
  // eslint-disable-next-line no-var
  var redisAvailable: boolean;
}

// Check if Redis credentials are available
const hasRedisCredentials = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// Create Redis client only if credentials are available
const createRedisClient = (): Redis | null => {
  if (!hasRedisCredentials) {
    console.warn('[Redis] No credentials configured. Caching and rate limiting will be disabled.');
    return null;
  }

  try {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      retry: {
        retries: 3,
        backoff: (retryCount) => Math.min(1000 * Math.pow(2, retryCount), 10000),
      },
    });
  } catch (error) {
    console.error('[Redis] Failed to create client:', error);
    return null;
  }
};

// Initialize Redis (singleton pattern for memory leak prevention)
export const redis: Redis | null =
  globalThis.redis !== undefined
    ? globalThis.redis
    : createRedisClient();

// Track Redis availability
export let redisAvailable = globalThis.redisAvailable ?? hasRedisCredentials;

// Store in global for development hot reload
if (process.env.NODE_ENV !== 'production') {
  globalThis.redis = redis;
  globalThis.redisAvailable = redisAvailable;
}

// ================================================================
// CACHING UTILITIES - Safe operations with graceful degradation
// ================================================================

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

/**
 * Get value from cache with graceful fallback
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  if (!redis || !redisAvailable) {
    return null;
  }

  try {
    const value = await redis.get<T>(key);
    return value;
  } catch (error) {
    console.error(`[Redis] GET failed for key ${key}:`, error);
    redisAvailable = false; // Disable temporarily
    return null;
  }
}

/**
 * Set value in cache with graceful fallback
 */
export async function setInCache<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<boolean> {
  if (!redis || !redisAvailable) {
    return false;
  }

  try {
    const { ttl = 3600 } = options;
    await redis.set(key, value, { ex: ttl });
    return true;
  } catch (error) {
    console.error(`[Redis] SET failed for key ${key}:`, error);
    redisAvailable = false;
    return false;
  }
}

/**
 * Delete key from cache
 */
export async function deleteFromCache(key: string): Promise<boolean> {
  if (!redis || !redisAvailable) {
    return false;
  }

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`[Redis] DEL failed for key ${key}:`, error);
    return false;
  }
}

/**
 * Invalidate multiple cache keys by pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<number> {
  if (!redis || !redisAvailable) {
    return 0;
  }

  try {
    let cursor = 0;
    let deletedCount = 0;

    do {
      const result = await redis.scan(cursor, {
        match: pattern,
        count: 100,
      });

      const newCursor = result[0];
      const keys = result[1];

      cursor = typeof newCursor === 'number' ? newCursor : Number(newCursor);

      if (keys.length > 0) {
        await redis.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== 0);

    console.log(`[Cache] Invalidated ${deletedCount} keys for pattern "${pattern}"`);
    return deletedCount;
  } catch (error) {
    console.error('[Cache] Invalidation failed:', error);
    return 0;
  }
}

/**
 * Get with cache lock to prevent cache stampede
 */
export async function getWithCacheLock<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl: number = 3600,
  maxRetries: number = 3
): Promise<T> {
  // Try to get from cache first
  if (redis && redisAvailable) {
    try {
      const cached = await redis.get<T>(cacheKey);
      if (cached !== null) {
        console.log(`[Cache] HIT for key: ${cacheKey}`);
        return cached;
      }
    } catch (error) {
      console.error('[Cache] GET error:', error);
    }
  }

  const lockKey = `lock:${cacheKey}`;
  const lockTTL = 10; // 10 seconds

  // Try to acquire lock to prevent stampede
  if (redis && redisAvailable) {
    try {
      const locked = await redis.set(lockKey, '1', { ex: lockTTL, nx: true });

      if (!locked) {
        // Wait and retry if lock is held by another process
        for (let i = 0; i < maxRetries; i++) {
          await new Promise(r => setTimeout(r, 100 * (i + 1)));
          const retryCache = await redis.get<T>(cacheKey);
          if (retryCache !== null) {
            console.log(`[Cache] HIT on retry for key: ${cacheKey}`);
            return retryCache;
          }
        }
        console.warn(`[Cache] Could not acquire lock for key: ${cacheKey}`);
      }
    } catch (error) {
      console.error('[Cache] Lock error:', error);
    }
  }

  // Fetch the data
  console.log(`[Cache] MISS for key: ${cacheKey}`);
  try {
    const result = await fetchFn();

    // Store in cache
    if (redis && redisAvailable) {
      try {
        await redis.set(cacheKey, result, { ex: ttl });
        console.log(`[Cache] SET for key: ${cacheKey}`);
        await redis.del(lockKey);
      } catch (error) {
        console.error('[Cache] SET error:', error);
      }
    }

    return result;
  } catch (error) {
    // Release lock on error
    if (redis && redisAvailable) {
      await redis.del(lockKey).catch(() => { });
    }
    throw error;
  }
}

// Health check
export async function checkRedisHealth(): Promise<boolean> {
  if (!redis) return false;

  try {
    await redis.ping();
    redisAvailable = true;
    return true;
  } catch (error) {
    console.error('[Redis] Health check failed:', error);
    redisAvailable = false;
    return false;
  }
}
