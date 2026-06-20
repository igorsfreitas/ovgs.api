import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditEvents1781997926486 implements MigrationInterface {
  name = 'CreateAuditEvents1781997926486';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."audit_events_action_enum" AS ENUM('SALES_ORDER_CREATED', 'SALES_ORDER_STATUS_CHANGED', 'SCHEDULE_CHANGED', 'SALES_ORDER_TRANSPORT_CHANGED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" "public"."audit_events_action_enum" NOT NULL, "entity_name" character varying NOT NULL, "entity_id" uuid NOT NULL, "previous_state" jsonb, "new_state" jsonb, "actor" text, "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_910f64d901a5c3e9878f0d4a407" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_24530679b55965efb260852679" ON "audit_events"  ("entity_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_24530679b55965efb260852679"`,
    );
    await queryRunner.query(`DROP TABLE "audit_events"`);
    await queryRunner.query(`DROP TYPE "public"."audit_events_action_enum"`);
  }
}
