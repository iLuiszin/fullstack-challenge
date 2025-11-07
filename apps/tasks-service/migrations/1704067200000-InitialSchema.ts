import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1704067200000 implements MigrationInterface {
    name = 'InitialSchema1704067200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
        `);

        // Task table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "task" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying(200) NOT NULL,
                "description" text,
                "deadline" TIMESTAMP,
                "priority" character varying NOT NULL DEFAULT 'MEDIUM',
                "status" character varying NOT NULL DEFAULT 'TODO',
                "createdBy" uuid NOT NULL,
                "creatorName" character varying(100),
                "updatedBy" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_task" PRIMARY KEY ("id")
            )
        `);

        // TaskAssignees table (snake_case columns to match entity)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "task_assignees" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "task_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "assigned_at" TIMESTAMP NOT NULL DEFAULT now(),
                "assigned_by" uuid,
                "username" character varying(100),
                CONSTRAINT "PK_task_assignees" PRIMARY KEY ("id")
            )
        `);

        // Comments table (plural to match entity)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "comments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "taskId" uuid NOT NULL,
                "content" text NOT NULL,
                "authorId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_comments" PRIMARY KEY ("id")
            )
        `);

        // TaskAudit table (simplified to match entity)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "task_audit" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "taskId" uuid NOT NULL,
                "action" character varying NOT NULL,
                "changes" jsonb,
                "performedBy" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_task_audit" PRIMARY KEY ("id")
            )
        `);

        // Foreign keys
        await queryRunner.query(`
            ALTER TABLE "task_assignees"
            ADD CONSTRAINT "FK_task_assignees_task"
            FOREIGN KEY ("task_id") REFERENCES "task"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "comments"
            ADD CONSTRAINT "FK_comments_task"
            FOREIGN KEY ("taskId") REFERENCES "task"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "task_audit"
            ADD CONSTRAINT "FK_task_audit_task"
            FOREIGN KEY ("taskId") REFERENCES "task"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Indexes for task table
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_task_status" ON "task" ("status")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_task_priority" ON "task" ("priority")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_task_createdBy" ON "task" ("createdBy")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_task_createdAt" ON "task" ("createdAt")
        `);

        // Indexes for task_assignees table
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "UQ_task_assignees_task_user" ON "task_assignees" ("task_id", "user_id")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_task_assignees_task_id" ON "task_assignees" ("task_id")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_task_assignees_user_id" ON "task_assignees" ("user_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.query(`ALTER TABLE "task_audit" DROP CONSTRAINT IF EXISTS "FK_task_audit_task"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "FK_comments_task"`);
        await queryRunner.query(`ALTER TABLE "task_assignees" DROP CONSTRAINT IF EXISTS "FK_task_assignees_task"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_task_assignees_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_task_assignees_task_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_task_assignees_task_user"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_task_createdAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_task_createdBy"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_task_priority"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_task_status"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS "task_audit"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "comments"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "task_assignees"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "task"`);
    }
}
