import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1704067200000 implements MigrationInterface {
    name = 'InitialSchema1704067200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
        `);

        // Notifications table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "notifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "type" character varying NOT NULL,
                "message" text NOT NULL,
                "metadata" jsonb,
                "isRead" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
            )
        `);

        // Indexes for better query performance
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_notifications_userId" ON "notifications" ("userId")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_notifications_isRead" ON "notifications" ("isRead")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_notifications_createdAt" ON "notifications" ("createdAt")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_createdAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_isRead"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_userId"`);

        // Drop table
        await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    }
}
