import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBookingsTable1755155741584 implements MigrationInterface {
    name = 'CreateBookingsTable1755155741584'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        const hasBookings = await queryRunner.hasTable('bookings');
        if (!hasBookings) {
            await queryRunner.query(`CREATE TABLE "bookings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "cognitoSub" character varying NOT NULL,
                "carId" character varying NOT NULL,
                "startDate" TIMESTAMP NOT NULL,
                "endDate" TIMESTAMP NOT NULL,
                "totalPrice" integer NOT NULL,
                "status" character varying NOT NULL DEFAULT 'pending',
                "notificationStatus" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_bookings_id" PRIMARY KEY ("id")
            )`);
        }

        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_bookings_cognitoSub" ON "bookings" ("cognitoSub")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_bookings_carId" ON "bookings" ("carId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_bookings_status" ON "bookings" ("status")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_carId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bookings_cognitoSub"`);
        const hasBookings = await queryRunner.hasTable('bookings');
        if (hasBookings) {
            await queryRunner.query(`DROP TABLE "bookings"`);
        }
    }
}
