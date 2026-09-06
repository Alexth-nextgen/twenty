import { type QueryRunner } from 'typeorm';

import { CreateRecordListMetadataFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-39/2-39-instance-command-fast-1788693923449-create-record-list-metadata';
import { CREATE_RECORD_LIST_METADATA_UPGRADE_COMMAND_NAME } from 'src/database/commands/upgrade-version-command/2-39/create-record-list-metadata-upgrade-command-name.constant';
import { getRegisteredInstanceCommandMetadata } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';

describe('CreateRecordListMetadataFastInstanceCommand', () => {
  const command = new CreateRecordListMetadataFastInstanceCommand();

  it('is registered against the current version with a matching name', () => {
    const metadata = getRegisteredInstanceCommandMetadata(
      CreateRecordListMetadataFastInstanceCommand,
    );

    expect(metadata).toEqual({
      timestamp: 1788693923449,
      type: 'fast',
      version: '2.39.0',
    });
    expect(
      `${metadata?.version}_${CreateRecordListMetadataFastInstanceCommand.name}_${metadata?.timestamp}`,
    ).toBe(CREATE_RECORD_LIST_METADATA_UPGRADE_COMMAND_NAME);
  });

  it('adds the record-list table and view context idempotently', async () => {
    const query = jest.fn().mockResolvedValue(undefined);

    await command.up({ query } as unknown as QueryRunner);

    const statements = query.mock.calls.map((call) => call[0] as string);

    expect(statements).toHaveLength(8);
    expect(statements[0]).toContain(
      'CREATE TABLE IF NOT EXISTS "core"."recordList"',
    );
    expect(statements[0]).toContain('UNIQUE ("entryObjectMetadataId")');
    expect(statements).toContain(
      'ALTER TABLE "core"."view" ADD COLUMN IF NOT EXISTS "recordListId" uuid',
    );
    expect(statements).toContain(
      'CREATE INDEX IF NOT EXISTS "IDX_VIEW_RECORD_LIST_ID" ON "core"."view" ("recordListId") ',
    );
    expect(
      statements.filter((statement) => statement.startsWith('DO $$')),
    ).toHaveLength(4);
  });

  it('removes the record-list metadata idempotently', async () => {
    const query = jest.fn().mockResolvedValue(undefined);

    await command.down({ query } as unknown as QueryRunner);

    const statements = query.mock.calls.map((call) => call[0] as string);

    expect(statements).toHaveLength(8);
    expect(statements).toContain(
      'ALTER TABLE "core"."view" DROP COLUMN IF EXISTS "recordListId"',
    );
    expect(statements[statements.length - 1]).toBe(
      'DROP TABLE IF EXISTS "core"."recordList"',
    );
  });
});
