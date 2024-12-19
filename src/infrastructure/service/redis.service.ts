import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis;

  constructor() {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

    if (!redisHost || isNaN(redisPort)) {
      throw new Error('Invalid Redis configuration: check REDIS_HOST and REDIS_PORT.');
    }

    this.client = new Redis({
      host: redisHost,
      port: redisPort,
    });

    console.log(`[Redis] Connected to host: ${redisHost}, port: ${redisPort}`);
  }

  async get(key: string): Promise<any> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`[Redis] Error in GET for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttl);
      console.log(`[Redis] SET key: ${key}, TTL: ${ttl}`);
    } catch (error) {
      console.error(`[Redis] Error in SET for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
      console.log(`[Redis] DEL key: ${key}`);
    } catch (error) {
      console.error(`[Redis] Error in DEL for key ${key}:`, error);
    }
  }
}
