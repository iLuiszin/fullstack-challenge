import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { DATABASE_CONFIG, NODE_ENV } from '../constants/config.constants';

config();

const databaseUrl = process.env.DB_LINK;

export const AppDataSource = new DataSource({
  type: DATABASE_CONFIG.TYPE,
  url: databaseUrl ?? DATABASE_CONFIG.DEFAULT_URL,
  entities: [join(__dirname, '/../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '/../../migrations/*{.ts,.js}')],
  migrationsTableName: DATABASE_CONFIG.MIGRATIONS_TABLE_NAME,
  synchronize: false,
  logging: process.env.NODE_ENV === NODE_ENV.DEVELOPMENT,
});
