import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSalesOrders1781919681419 implements MigrationInterface {
  name = 'CreateSalesOrders1781919681419';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."sales_orders_status_enum" AS ENUM('CRIADA', 'PLANEJADA', 'AGENDADA', 'EM_TRANSPORTE', 'ENTREGUE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "sales_orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."sales_orders_status_enum" NOT NULL DEFAULT 'CRIADA', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "customer_id" uuid NOT NULL, "transport_type_id" uuid NOT NULL, CONSTRAINT "PK_5328297e067ca929fbe7cf989dd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sales_order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quantity" integer NOT NULL, "sales_order_id" uuid NOT NULL, "item_id" uuid NOT NULL, CONSTRAINT "PK_a5f8d983ae4db44dcc923faf2ef" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_orders" ADD CONSTRAINT "FK_1fb56bee917dfd98ada56d626de" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_orders" ADD CONSTRAINT "FK_791dd2cf76ea5880f23ee424bdf" FOREIGN KEY ("transport_type_id") REFERENCES "transport_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_items" ADD CONSTRAINT "FK_bdab0ead28df1ee5283a111d1af" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_items" ADD CONSTRAINT "FK_81efa4653ef3647faacf95b7f16" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sales_order_items" DROP CONSTRAINT "FK_81efa4653ef3647faacf95b7f16"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_order_items" DROP CONSTRAINT "FK_bdab0ead28df1ee5283a111d1af"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_orders" DROP CONSTRAINT "FK_791dd2cf76ea5880f23ee424bdf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_orders" DROP CONSTRAINT "FK_1fb56bee917dfd98ada56d626de"`,
    );
    await queryRunner.query(`DROP TABLE "sales_order_items"`);
    await queryRunner.query(`DROP TABLE "sales_orders"`);
    await queryRunner.query(`DROP TYPE "public"."sales_orders_status_enum"`);
  }
}
