import configuration from '@/config';
import { rabbitmq } from './index';

export async function publishMessage(routingKey: string, message: any) {
  const channel = await rabbitmq.getChannel();
  const buffer = Buffer.from(JSON.stringify(message));
  channel.publish(configuration.rabbitmqExchangeName, routingKey, buffer, {
    persistent: true,
  });
  console.log(` Published [${routingKey}]`, message);
}

export async function publishToQueue<T>(
  queue: string,
  message: T
): Promise<void> {
  const ch = await rabbitmq.getChannel();
  await ch.assertQueue(queue, { durable: true });
  ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
}
