import amqp from 'amqplib';
import type { Channel, Connection } from 'amqplib';
import { ExampleConsumer } from './consumers';
import configuration from '@/config';

let connection: Connection | any = null;
let channel: Channel | any = null;
let connecting: Promise<void> | any = null;

export const rabbitmq = {
  async connect(
    retryCount = 5,
    retryDelay = 3000
  ): Promise<{ connection: Connection; channel: Channel }> {
    if (connection && channel) {
      return { connection, channel };
    }

    if (connecting) {
      await connecting;
      return { connection: connection!, channel: channel! };
    }

    const newConnectionPromise = this._createConnection(retryCount, retryDelay);
    connecting = newConnectionPromise;

    await newConnectionPromise;
    // avoid atomic update warning: only clear if still same promise
    if (connecting === newConnectionPromise) {
      connecting = null;
    }

    return { connection: connection!, channel: channel! };
  },

  async _createConnection(retryCount: number, retryDelay: number) {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        console.log(
          `🐇 Connecting to RabbitMQ (attempt ${attempt}/${retryCount})...`
        );

        const conn = await amqp.connect(configuration.rabbimqUrl);
        const ch = await conn.createChannel();

        await ch.assertExchange(
          configuration.rabbitmqExchangeName,
          configuration.rabbitmqExchangeType,
          { durable: true }
        );

        ExampleConsumer.ExampleProcess(ch);

        // safely assign after all awaits complete
        connection = conn;
        channel = ch;

        console.log('✅ RabbitMQ connected successfully');
        return;
      } catch (err) {
        console.error(
          `❌ RabbitMQ connection failed (attempt ${attempt}):`,
          (err as Error).message
        );

        if (attempt === retryCount) {
          console.error(
            '🚨 Max retries reached. Could not connect to RabbitMQ.'
          );
          throw new Error(
            `RabbitMQ connection failed: ${(err as Error).message}`
          );
        }

        // wait before retrying
        await new Promise<void>((resolve) => {
          setTimeout(resolve, retryDelay);
        });
      }
    }
  },

  async getChannel(): Promise<Channel> {
    if (!channel) {
      console.warn('⚠️ Channel not initialized. Trying to reconnect...');
      await this.connect();
    }
    return channel!;
  },

  async close() {
    try {
      const ch = channel;
      const conn = connection;

      if (ch) {
        await ch.close();
      }
      if (conn) {
        await conn.close();
      }

      console.log('🔌 RabbitMQ connection closed gracefully');
    } catch (err) {
      console.error(
        '⚠️ Error closing RabbitMQ connection:',
        (err as Error).message
      );
    }
  },
};
