import type { ConsumeMessage } from 'amqplib';
import { rabbitmq } from './index';
import configuration from '@/config';

export async function consumeMessage(
  queueName: string,
  routingKey: string,
  handler: (msg: any) => Promise<void>
) {
  const channel = await rabbitmq.getChannel();
  await channel.assertQueue(queueName, { durable: true });
  await channel.bindQueue(queueName, configuration.rabbimqUrl, routingKey);

  channel.consume(queueName, async (msg: any) => {
    if (msg) {
      const data = JSON.parse(msg.content.toString());
      try {
        await handler(data);
        channel.ack(msg);
      } catch (error) {
        console.error(' RabbitMQ handler error:', error);
        channel.nack(msg, false, false);
      }
    }
  });

  console.log(`👂 Listening queue: ${queueName}, key: ${routingKey}`);
}

/**
 * Basic single-message consumer.
 */
export async function consumeFromQueue<T>(
  queue: string,
  callback: (msg: T) => void
): Promise<void> {
  const ch = await rabbitmq.getChannel();
  await ch.assertQueue(queue, { durable: true });

  ch.consume(queue, (msg: ConsumeMessage | null) => {
    if (msg) {
      try {
        const data = JSON.parse(msg.content.toString()) as T;
        callback(data);
        ch.ack(msg);
      } catch (err) {
        console.error(' Message processing failed:', err);
        ch.nack(msg, false, false);
      }
    }
  });
}
