import { type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.39.0', 1788693923449)
export class CreateRecordListMetadataFastInstanceCommand implements FastInstanceCommand {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE IF NOT EXISTS "core"."recordList" ("workspaceId" uuid NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "icon" text, "position" double precision NOT NULL DEFAULT \'0\', "parentObjectMetadataId" uuid NOT NULL, "entryObjectMetadataId" uuid NOT NULL, "createdByUserWorkspaceId" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "REL_b7dbaac5269cbb1fd3567de72c" UNIQUE ("entryObjectMetadataId"), CONSTRAINT "PK_426239f0584b1a5849d1da47f0d" PRIMARY KEY ("id"))',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_RECORD_LIST_WORKSPACE_ID_PARENT_OBJECT_METADATA_ID" ON "core"."recordList" ("workspaceId", "parentObjectMetadataId") ',
    );
    await queryRunner.query(
      'ALTER TABLE "core"."view" ADD COLUMN IF NOT EXISTS "recordListId" uuid',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_VIEW_RECORD_LIST_ID" ON "core"."view" ("recordListId") ',
    );
    await queryRunner.query(
      'DO $$ BEGIN ALTER TABLE "core"."recordList" ADD CONSTRAINT "FK_7216ee8afa35c432f9d4bb51e46" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object THEN NULL; END $$',
    );
    await queryRunner.query(
      'DO $$ BEGIN ALTER TABLE "core"."recordList" ADD CONSTRAINT "FK_ed2e2d229f5e4f5f6fcc7439ca7" FOREIGN KEY ("parentObjectMetadataId") REFERENCES "core"."objectMetadata"("id") ON DELETE CASCADE ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object THEN NULL; END $$',
    );
    await queryRunner.query(
      'DO $$ BEGIN ALTER TABLE "core"."recordList" ADD CONSTRAINT "FK_b7dbaac5269cbb1fd3567de72c2" FOREIGN KEY ("entryObjectMetadataId") REFERENCES "core"."objectMetadata"("id") ON DELETE CASCADE ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object THEN NULL; END $$',
    );
    await queryRunner.query(
      'DO $$ BEGIN ALTER TABLE "core"."recordList" ADD CONSTRAINT "FK_cdae7971694850f4f32a1b55b20" FOREIGN KEY ("createdByUserWorkspaceId") REFERENCES "core"."userWorkspace"("id") ON DELETE SET NULL ON UPDATE NO ACTION; EXCEPTION WHEN duplicate_object THEN NULL; END $$',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "core"."recordList" DROP CONSTRAINT IF EXISTS "FK_cdae7971694850f4f32a1b55b20"',
    );
    await queryRunner.query(
      'ALTER TABLE "core"."recordList" DROP CONSTRAINT IF EXISTS "FK_b7dbaac5269cbb1fd3567de72c2"',
    );
    await queryRunner.query(
      'ALTER TABLE "core"."recordList" DROP CONSTRAINT IF EXISTS "FK_ed2e2d229f5e4f5f6fcc7439ca7"',
    );
    await queryRunner.query(
      'ALTER TABLE "core"."recordList" DROP CONSTRAINT IF EXISTS "FK_7216ee8afa35c432f9d4bb51e46"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "core"."IDX_VIEW_RECORD_LIST_ID"',
    );
    await queryRunner.query(
      'ALTER TABLE "core"."view" DROP COLUMN IF EXISTS "recordListId"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "core"."IDX_RECORD_LIST_WORKSPACE_ID_PARENT_OBJECT_METADATA_ID"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "core"."recordList"');
  }
}
