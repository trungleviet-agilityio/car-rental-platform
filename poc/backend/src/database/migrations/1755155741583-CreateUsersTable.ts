import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1755155741583 implements MigrationInterface {
    name = 'CreateUsersTable1755155741583'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cognitoSub" character varying NOT NULL, "username" character varying, "phoneNumber" character varying, "email" character varying, "kycStatus" character varying NOT NULL DEFAULT 'unverified', "kycKey" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8dae86a9940f71b14c18d868b37" UNIQUE ("cognitoSub"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
