import { logger } from '@/utils/logger';
import Redis from 'ioredis';
import type { RedisOptions } from 'ioredis';
import configuration from '@/config';
const redisUrl = configuration.redisUrl as string;
const isAWS = redisUrl?.includes('amazonaws.com');
class RedisClient {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<Redis> {
    const config: RedisOptions = {
      ...(isAWS
        ? {
            socket: {
              tls: true, // Enable TLS only for AWS Redis
            },
          }
        : {}),
      // Retry strategy
      retryStrategy: (times: number): number | null => {
        const maxRetries = parseInt(process.env.REDIS_MAX_RETRIES || '3');
        const delay = parseInt(process.env.REDIS_RETRY_DELAY || '1000');

        if (times > maxRetries) {
          console.error('Redis max retries reached. Giving up.');
          return null; // Stop retrying
        }

        const retryDelay = Math.min(times * delay, 3000);
        console.log(`Redis retry attempt ${times}, waiting ${retryDelay}ms`);
        return retryDelay;
      },

      //Connection setting
      connectTimeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT || '10000'),
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      // Keep-alive
      keepAlive: 30000,

      // Reconnect settings
      reconnectOnError: (err: Error): boolean | 1 | 2 => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true; // Reconnect
        }
        return false;
      },
    };

    this.client = new Redis(redisUrl, config);
    // Event handlers
    this.client.on('connect', () => {
      logger.info('✓ Redis connecting...');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      logger.info('✓ Redis connected and ready');
    });

    this.client.on('error', (err: Error) => {
      logger.error(`✗ Redis Connection Error:${err}`);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger.info('✗ Redis connection closed');

      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('↻ Redis reconnecting...');
    });

    return this.client;
  }
  /**
   * Get client instance
   */
  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client not initialized. Call connect() first.');
    }
    return this.client;
  }
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch (error) {
      logger.info(`Redis health check failed:${error}`);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('✓ Redis disconnected gracefully');
    }
  }
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export default RedisClient;
