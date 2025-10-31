import 'reflect-metadata';
import { DataSource } from 'typeorm';
import fs from 'fs';
// Import entities
import { User } from '@/entities';
import config from '@/config';
import { logger } from '@/utils/logger';

const {postgresUrl,nodeEnv} = config;
const isRDS = postgresUrl.includes('amazonaws.com');

export const postgresDataSource = new DataSource({
  type: 'postgres',
  url: postgresUrl,
  synchronize: nodeEnv==="development",
  logging: false,
  entities: [User],
  ssl: isRDS
    ? {
        ca: fs.readFileSync('./global-bundle.pem').toString(),
      }
    : false,
});

export async function connectPostgres() {
  try {
    await postgresDataSource.initialize();
    logger.info('✅ PostgreSQL connected');
  } catch (err) {
    logger.error('❌ PostgreSQL connection failed',{ err });
    throw err;
  }
}

export async function disconnectPostgres() {
  try {
    if (postgresDataSource.isInitialized) {
      await postgresDataSource.destroy();
      logger.info('🛑 PostgreSQL disconnected');
    } else {
      logger.warn(
        '⚠️ PostgreSQL DataSource not initialized, skipping disconnect'
      );
    }
  } catch (err) {
    logger.error('❌ Error during PostgreSQL disconnect',{ err });
    throw err;
  }
}
