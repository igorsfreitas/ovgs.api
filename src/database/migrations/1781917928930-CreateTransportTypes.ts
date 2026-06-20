import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransportTypes1781917928930 implements MigrationInterface {
  name = 'CreateTransportTypes1781917928930';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "transport_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "code" character varying NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_5948f0e0931c67380bac233fbaa" UNIQUE ("code"), CONSTRAINT "PK_798b40b4bdf4aa75d716cdf954c" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "transport_types"`);
  }
}
