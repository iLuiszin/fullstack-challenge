import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import { DATABASE_CONFIG, NODE_ENV } from '../constants/config.constants';

export const getDatabaseConfig = (
  configService: ConfigService,
): DataSourceOptions => {
  const databaseUrl = configService.get<string>('DB_LINK');

  return {
    type: DATABASE_CONFIG.TYPE,
    url: databaseUrl ?? DATABASE_CONFIG.DEFAULT_URL,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
    migrationsTableName: DATABASE_CONFIG.MIGRATIONS_TABLE_NAME,
    migrationsRun: false,
    synchronize: false,
    logging: configService.get('NODE_ENV') === NODE_ENV.DEVELOPMENT,
  };
};
