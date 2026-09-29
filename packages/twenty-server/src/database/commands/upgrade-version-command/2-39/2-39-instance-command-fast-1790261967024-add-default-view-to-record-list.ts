import { type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.39.0', 1790261967024)
export class AddDefaultViewToRecordListFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "core"."recordList" ADD COLUMN IF NOT EXISTS "defaultViewId" uuid',
    );
    await queryRunner.query(
      'DO $$ BEGIN ALTER TABLE "core"."recordList" ADD CONSTRAINT "FK_record_list_default_view" FOREIGN KEY ("defaultViewId") REFERENCES "core"."view"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "core"."recordList" DROP CONSTRAINT IF EXISTS "FK_record_list_default_view"',
    );
    await queryRunner.query(
      'ALTER TABLE "core"."recordList" DROP COLUMN IF EXISTS "defaultViewId"',
    );
  }
}
