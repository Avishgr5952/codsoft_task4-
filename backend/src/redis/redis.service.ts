import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isRedisConnected = false;
  private memoryCache = new Map<string, { value: string; expiresAt?: number }>();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisEnabled = this.configService.get<string>('REDIS_ENABLED') !== 'false';
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');

    if (!redisEnabled) {
      this.logger.log('Redis is disabled by config. Using robust in-memory fallback cache.');
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        retryStrategy: () => null, // Do not spam reconnects on dev if Redis is not running
      });

      this.client.on('connect', () => {
        this.isRedisConnected = true;
        this.logger.log(`Connected to Redis at ${redisUrl}`);
      });

      this.client.on('error', (err) => {
        if (this.isRedisConnected) {
          this.logger.warn(`Redis error: ${err.message}. Falling back to in-memory cache.`);
        }
        this.isRedisConnected = false;
      });
    } catch (error: any) {
      this.logger.warn(`Could not connect to Redis: ${error?.message}. Using in-memory fallback cache.`);
      this.isRedisConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.isRedisConnected && this.client) {
        const raw = await this.client.get(key);
        if (!raw) return null;
        return JSON.parse(raw);
      }
    } catch {
      // Fallback to memory
    }

    // Memory cache fallback
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    try {
      return JSON.parse(entry.value);
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const stringified = JSON.stringify(value);

    try {
      if (this.isRedisConnected && this.client) {
        if (ttlSeconds) {
          await this.client.setex(key, ttlSeconds, stringified);
        } else {
          await this.client.set(key, stringified);
        }
        return;
      }
    } catch {
      // Fallback to memory
    }

    // Memory cache fallback
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memoryCache.set(key, { value: stringified, expiresAt });
  }

  async del(key: string): Promise<void> {
    try {
      if (this.isRedisConnected && this.client) {
        await this.client.del(key);
      }
    } catch {
      // Fallback
    }
    this.memoryCache.delete(key);
  }

  async delByPrefix(prefix: string): Promise<void> {
    try {
      if (this.isRedisConnected && this.client) {
        const keys = await this.client.keys(`${prefix}*`);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      }
    } catch {
      // Fallback
    }

    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }
  }

  async flush(): Promise<void> {
    try {
      if (this.isRedisConnected && this.client) {
        await this.client.flushdb();
      }
    } catch {
      // Fallback
    }
    this.memoryCache.clear();
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }
}
