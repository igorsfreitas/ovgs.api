import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSchedules1781920616854 implements MigrationInterface {
  name = 'CreateSchedules1781920616854';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."schedules_status_enum" AS ENUM('PENDING', 'CONFIRMED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "delivery_date" date NOT NULL, "window_start" TIME NOT NULL, "window_end" TIME NOT NULL, "status" "public"."schedules_status_enum" NOT NULL DEFAULT 'PENDING', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "sales_order_id" uuid NOT NULL, CONSTRAINT "REL_52cbef845b15b89697ec415675" UNIQUE ("sales_order_id"), CONSTRAINT "PK_7e33fc2ea755a5765e3564e66dd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD CONSTRAINT "FK_52cbef845b15b89697ec4156751" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "schedules" DROP CONSTRAINT "FK_52cbef845b15b89697ec4156751"`,
    );
    await queryRunner.query(`DROP TABLE "schedules"`);
    await queryRunner.query(`DROP TYPE "public"."schedules_status_enum"`);
  }
}
