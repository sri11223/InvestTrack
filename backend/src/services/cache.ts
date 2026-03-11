import NodeCache from 'node-cache';
import { logger } from '../utils/logger.js';

class CacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false, // Performance: avoid deep cloning
    });

    this.cache.on('expired', (key) => {
      logger.debug(`Cache key expired: ${key}`);
    });
  }

  get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key);
    if (value !== undefined) {
      logger.debug(`Cache HIT: ${key}`);
    } else {
      logger.debug(`Cache MISS: ${key}`);
    }
    return value;
  }

  set<T>(key: string, value: T, ttlSeconds: number): boolean {
    const success = this.cache.set(key, value, ttlSeconds);
    if (success) {
      logger.debug(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
    }
    return success;
  }

  del(key: string): number {
    return this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
    logger.info('Cache flushed');
  }

  getStats() {
    return this.cache.getStats();
  }
}

// Singleton instance
export const cacheService = new CacheService();
