import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomers1781918600474 implements MigrationInterface {
  name = 'CreateCustomers1781918600474';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "document" character varying NOT NULL, "email" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_68c9c024a07c49ad6a2072d23c6" UNIQUE ("document"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "customer_authorized_transport_types" ("customer_id" uuid NOT NULL, "transport_type_id" uuid NOT NULL, CONSTRAINT "PK_37f57a759c3db852604f1785782" PRIMARY KEY ("customer_id", "transport_type_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1ba30b267b35816f231bb01b5f" ON "customer_authorized_transport_types"  ("customer_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_84ddede2114a2ba041cddc9017" ON "customer_authorized_transport_types"  ("transport_type_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_authorized_transport_types" ADD CONSTRAINT "FK_1ba30b267b35816f231bb01b5f3" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_authorized_transport_types" ADD CONSTRAINT "FK_84ddede2114a2ba041cddc90172" FOREIGN KEY ("transport_type_id") REFERENCES "transport_types"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customer_authorized_transport_types" DROP CONSTRAINT "FK_84ddede2114a2ba041cddc90172"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_authorized_transport_types" DROP CONSTRAINT "FK_1ba30b267b35816f231bb01b5f3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_84ddede2114a2ba041cddc9017"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1ba30b267b35816f231bb01b5f"`,
    );
    await queryRunner.query(`DROP TABLE "customer_authorized_transport_types"`);
    await queryRunner.query(`DROP TABLE "customers"`);
  }
}
