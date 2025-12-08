/**
 * Request Deduplication Utility
 * Prevents duplicate API calls during rapid interactions
 * Enterprise-grade memory-efficient implementation
 */

// In-flight request cache with automatic cleanup
const inFlightRequests = new Map<string, Promise<any>>();

// Request timeout for cleanup (5 minutes)
const REQUEST_TIMEOUT = 5 * 60 * 1000;

/**
 * Deduplicate identical requests that are in-flight
 * Prevents multiple identical API calls from being made simultaneously
 * 
 * @param key - Unique identifier for the request
 * @param fetcher - The async function to execute
 * @returns Promise resolving to the fetcher result
 */
export async function deduplicateRequest<T>(
    key: string,
    fetcher: () => Promise<T>
): Promise<T> {
    // Check if request is already in flight
    const existing = inFlightRequests.get(key);
    if (existing) {
        return existing as Promise<T>;
    }

    // Create new request with cleanup
    const request = fetcher()
        .then((result) => {
            // Clean up after successful completion
            inFlightRequests.delete(key);
            return result;
        })
        .catch((error) => {
            // Clean up on error
            inFlightRequests.delete(key);
            throw error;
        });

    // Store in cache
    inFlightRequests.set(key, request);

    // Safeguard cleanup after timeout (prevents memory leaks)
    setTimeout(() => {
        inFlightRequests.delete(key);
    }, REQUEST_TIMEOUT);

    return request;
}

/**
 * Debounce utility for rate-limiting function calls
 * Memory-efficient implementation with proper cleanup
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): {
    (...args: Parameters<T>): void;
    cancel: () => void;
    flush: () => void;
} {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastArgs: Parameters<T> | null = null;

    const debouncedFn = (...args: Parameters<T>) => {
        lastArgs = args;

        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            if (lastArgs) {
                func(...lastArgs);
                lastArgs = null;
            }
            timeoutId = null;
        }, wait);
    };

    debouncedFn.cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        lastArgs = null;
    };

    debouncedFn.flush = () => {
        if (timeoutId && lastArgs) {
            clearTimeout(timeoutId);
            func(...lastArgs);
            lastArgs = null;
            timeoutId = null;
        }
    };

    return debouncedFn;
}

/**
 * Throttle utility for rate-limiting function calls
 * Ensures function is called at most once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;
    let lastArgs: Parameters<T> | null = null;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;

            setTimeout(() => {
                inThrottle = false;
                if (lastArgs) {
                    func(...lastArgs);
                    lastArgs = null;
                }
            }, limit);
        } else {
            lastArgs = args;
        }
    };
}

/**
 * Memory-efficient LRU Cache implementation
 * Used for caching expensive computations client-side
 */
export class LRUCache<K, V> {
    private maxSize: number;
    private cache: Map<K, V>;

    constructor(maxSize: number = 100) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }

    get(key: K): V | undefined {
        const value = this.cache.get(key);
        if (value !== undefined) {
            // Move to end (most recently used)
            this.cache.delete(key);
            this.cache.set(key, value);
        }
        return value;
    }

    set(key: K, value: V): void {
        // Delete if exists to update position
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        // Evict oldest if at capacity
        else if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, value);
    }

    has(key: K): boolean {
        return this.cache.has(key);
    }

    delete(key: K): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    get size(): number {
        return this.cache.size;
    }
}

/**
 * Cleanup utility for preventing memory leaks in async operations
 * Use with useEffect to cancel pending operations on unmount
 */
export function createAbortController(): AbortController {
    return new AbortController();
}

/**
 * Check if an error is an abort error (for graceful handling)
 */
export function isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
}
