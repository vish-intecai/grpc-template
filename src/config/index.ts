const configuration = {
  url: "localhost",
  port: 50051,
  taskServicegRPCUrl: "localhost",
  taskServicegRPCPort: 50051,
  nodeEnv: process.env.NODE_ENV || "development",
  rabbimqUrl: process.env.RABBITMQ_URL || "amqp://localhost",
  rabbitmqExchangeName: process.env.RABBITMQ_EXCHANGE_NAME || "tasks_exchange",
  rabbitmqExchangeType: process.env.RABBITMQ_EXCHANGE_TYPE || "direct",
  postgresUrl: process.env.POSTGRES_URL || "postgresql://postgres:1234@localhost:5432/express",
};

export default configuration;
