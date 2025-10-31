import { DataSourceOptions } from 'typeorm';

const dbLink = process.env.DB_LINK;
const useCloudDatabase = !!dbLink;

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: dbLink || 'postgres://postgres:password@localhost:5432/challenge_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
  migrationsRun: true,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  ssl: useCloudDatabase ? { rejectUnauthorized: true } : false,
};

export default dataSourceOptions;
