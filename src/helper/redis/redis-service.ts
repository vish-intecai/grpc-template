import RedisClient from '@/config/database/redis';
import type Redis from 'ioredis';

class RedisService {
  private client: Redis;

  constructor(redisClient: Redis) {
    this.client = redisClient;
  }

  /**
   * SET with expiration
   */
  async set<T>(
    key: string,
    value: T,
    expiryInSeconds?: number
  ): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (expiryInSeconds) {
        await this.client.setex(key, expiryInSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * GET with JSON parsing
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * DELETE
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error(`Redis DELETE error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * DELETE multiple keys
   */
  async deleteMany(keys: string[]): Promise<number> {
    try {
      if (keys.length === 0) {
        return 0;
      }
      return await this.client.del(...keys);
    } catch (error) {
      console.error(`Redis DELETE MANY error:`, error);
      throw error;
    }
  }

  /**
   * EXISTS
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * SET with NX (only if not exists)
   */
  async setIfNotExists<T>(
    key: string,
    value: T,
    expiryInSeconds?: number
  ): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (expiryInSeconds) {
        const result = await this.client.set(
          key,
          serialized,
          'EX',
          expiryInSeconds,
          'NX'
        );
        return result === 'OK';
      }
      const result = await this.client.setnx(key, serialized);
      return result === 1;
    } catch (error) {
      console.error(`Redis SETNX error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * INCR
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.client.incrby(key, amount);
    } catch (error) {
      console.error(`Redis INCR error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * DECR
   */
  async decrement(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.client.decrby(key, amount);
    } catch (error) {
      console.error(`Redis DECR error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * SET with TTL in milliseconds
   */
  async setWithTTL<T>(key: string, value: T, ttlMs: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      await this.client.set(key, serialized, 'PX', ttlMs);
      return true;
    } catch (error) {
      console.error(`Redis SET with TTL error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get TTL for a key
   */
  async getTTL(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error(`Redis TTL error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * EXPIRE - set expiration on existing key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXPIRE error for key ${key}:`, error);
      throw error;
    }
  }
}

async function StartRedis(): Promise<RedisService> {
  const redisClient = new RedisClient();
  await redisClient.connect();
  const redis = new RedisService(redisClient.getClient());

  try {
    // Health check
    const isHealthy = await redisClient.healthCheck();
    console.log('Redis health:', isHealthy ? 'OK' : 'FAILED');

    if (!isHealthy) {
      throw new Error('Redis health check failed');
    }
    return redis;
  } catch (error) {
    console.error('Error in Redis:', error);
    await redisClient.disconnect();
    throw error;
  }
}

async function StopRedis() {
  const redisClient = new RedisClient();
  console.log('Shutting down Redis...');
  await redisClient.disconnect();
}

export default RedisService;
export { StopRedis, StartRedis };
