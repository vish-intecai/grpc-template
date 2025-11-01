import { consumeFromQueue } from '../consumer';

export class ExampleConsumer {
  static async ExampleProcess(channel: any) {
    await consumeFromQueue('example-queue', async (msg: any) => {
      try {
        console.log('[RabbitMQ] Received message:', msg);
        //  Acknowledge message on success
        channel.ack(msg);
      } catch (error) {
        console.error('[ExampleConsumer] Error processing order:', error);
      }
    });
  }
}
