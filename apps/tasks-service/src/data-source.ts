import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'path';

config();

const dbLink = process.env.DB_LINK;
const useCloudDatabase = !!dbLink;

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: dbLink || 'postgres://postgres:password@localhost:5432/challenge_db',
  entities: [join(__dirname, '/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '/../migrations/*{.ts,.js}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: useCloudDatabase ? { rejectUnauthorized: true } : false,
});
