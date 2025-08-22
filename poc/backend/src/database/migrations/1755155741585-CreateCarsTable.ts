import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCarsTable1755155741585 implements MigrationInterface {
    name = 'CreateCarsTable1755155741585'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        const hasCars = await queryRunner.hasTable('cars');
        if (!hasCars) {
            await queryRunner.query(`CREATE TABLE "cars" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "make" character varying NOT NULL,
                "model" character varying NOT NULL,
                "seats" integer NOT NULL,
                "pricePerDayCents" integer NOT NULL,
                "depositCents" integer NOT NULL DEFAULT 0,
                "ownerEmail" character varying,
                "ownerPhone" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_cars_id" PRIMARY KEY ("id")
            )`);
        }
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_cars_make_model" ON "cars" ("make", "model")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cars_make_model"`);
        const hasCars = await queryRunner.hasTable('cars');
        if (hasCars) {
            await queryRunner.query(`DROP TABLE "cars"`);
        }
    }
}
