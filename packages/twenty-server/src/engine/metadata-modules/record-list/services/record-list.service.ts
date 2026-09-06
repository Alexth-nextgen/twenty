import { Injectable } from '@nestjs/common';
import { v4 } from 'uuid';

import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { RecordListEntity } from 'src/engine/metadata-modules/record-list/entities/record-list.entity';
import {
  RecordListException,
  RecordListExceptionCode,
} from 'src/engine/metadata-modules/record-list/record-list.exception';
import {
  buildRecordListEntryObjectInput,
  buildRecordListSourceRecordFieldInput,
} from 'src/engine/metadata-modules/record-list/utils/build-record-list-entry-object-input';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';

export type RecordListEntryRecord = {
  id: string;
  sourceRecordId: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class RecordListService {
  constructor(
    @InjectWorkspaceScopedRepository(RecordListEntity)
    private readonly recordListRepository: WorkspaceScopedRepository<RecordListEntity>,
    private readonly objectMetadataService: ObjectMetadataService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly workspaceOrmManager: WorkspaceOrmManager,
  ) {}

  async findAll({ workspaceId }: { workspaceId: string }) {
    return await this.recordListRepository.find(workspaceId, {
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOneOrThrow({
    id,
    workspaceId,
  }: {
    id: string;
    workspaceId: string;
  }) {
    const recordList = await this.recordListRepository.findOneBy(workspaceId, {
      id,
    });

    if (recordList === null) {
      throw new RecordListException(
        'Record list not found in workspace',
        RecordListExceptionCode.RECORD_LIST_NOT_FOUND,
      );
    }

    return recordList;
  }

  async createRecordList({
    name,
    icon = null,
    parentObjectMetadataId,
    workspaceId,
    createdByUserWorkspaceId = null,
  }: {
    name: string;
    icon?: string | null;
    parentObjectMetadataId: string;
    workspaceId: string;
    createdByUserWorkspaceId?: string | null;
  }): Promise<RecordListEntity> {
    const parentObjectMetadata =
      await this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
        where: { id: parentObjectMetadataId },
      });

    if (parentObjectMetadata === null) {
      throw new RecordListException(
        'Parent object metadata not found in workspace',
        RecordListExceptionCode.PARENT_OBJECT_NOT_FOUND,
      );
    }

    const recordListId = v4();
    const entryObjectMetadata =
      await this.objectMetadataService.createOneObject({
        createObjectInput: buildRecordListEntryObjectInput({
          recordListId,
          recordListName: name,
        }),
        workspaceId,
        shouldCreateObjectNavigationItems: false,
        recordListId,
      });

    try {
      await this.fieldMetadataService.createOneField({
        createFieldInput: buildRecordListSourceRecordFieldInput({
          entryObjectMetadataId: entryObjectMetadata.id,
          parentObjectMetadataId,
          parentObjectLabelSingular: parentObjectMetadata.labelSingular,
          recordListName: name,
        }),
        workspaceId,
      });

      return await this.recordListRepository.insertAndReturnOne(workspaceId, {
        id: recordListId,
        name,
        icon,
        position:
          ((await this.recordListRepository.maximum(workspaceId, 'position')) ??
            -1) + 1,
        parentObjectMetadataId,
        entryObjectMetadataId: entryObjectMetadata.id,
        createdByUserWorkspaceId,
      });
    } catch (error) {
      await this.objectMetadataService
        .deleteOneObject({
          deleteObjectInput: { id: entryObjectMetadata.id },
          workspaceId,
        })
        .catch(() => undefined);

      throw error;
    }
  }

  async updateRecordList({
    id,
    name,
    icon,
    position,
    workspaceId,
  }: {
    id: string;
    name?: string;
    icon?: string | null;
    position?: number;
    workspaceId: string;
  }) {
    await this.findOneOrThrow({ id, workspaceId });

    await this.recordListRepository.update(
      workspaceId,
      { id },
      {
        ...(name !== undefined ? { name } : {}),
        ...(icon !== undefined ? { icon } : {}),
        ...(position !== undefined ? { position } : {}),
      },
    );

    return await this.findOneOrThrow({ id, workspaceId });
  }

  async deleteRecordList({
    id,
    workspaceId,
  }: {
    id: string;
    workspaceId: string;
  }) {
    const recordList = await this.findOneOrThrow({ id, workspaceId });

    await this.objectMetadataService.deleteOneObject({
      deleteObjectInput: { id: recordList.entryObjectMetadataId },
      workspaceId,
    });

    return recordList;
  }

  async findRecordListEntries({
    recordListId,
    workspaceId,
  }: {
    recordListId: string;
    workspaceId: string;
  }): Promise<RecordListEntryRecord[]> {
    const { entryObjectMetadataNameSingular } =
      await this.resolveRecordListObjectNames({ recordListId, workspaceId });
    const entryRepository =
      this.workspaceOrmManager.getRepository<RecordListEntryRecord>(
        entryObjectMetadataNameSingular,
        { shouldBypassPermissionChecks: true },
      );

    return await entryRepository.find({
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  }

  async addRecordToList({
    recordListId,
    sourceRecordId,
    workspaceId,
  }: {
    recordListId: string;
    sourceRecordId: string;
    workspaceId: string;
  }): Promise<RecordListEntryRecord> {
    const {
      parentObjectMetadataNameSingular,
      entryObjectMetadataNameSingular,
    } = await this.resolveRecordListObjectNames({ recordListId, workspaceId });
    const parentRepository = this.workspaceOrmManager.getRepository(
      parentObjectMetadataNameSingular,
      { shouldBypassPermissionChecks: true },
    );

    if (!(await parentRepository.existsBy({ id: sourceRecordId }))) {
      throw new RecordListException(
        'Source record not found in workspace object',
        RecordListExceptionCode.SOURCE_RECORD_NOT_FOUND,
      );
    }

    const entryRepository =
      this.workspaceOrmManager.getRepository<RecordListEntryRecord>(
        entryObjectMetadataNameSingular,
        { shouldBypassPermissionChecks: true },
      );
    const position = (await entryRepository.maximum('position')) ?? -1;
    const insertResult = await entryRepository.insert({
      sourceRecordId,
      position: position + 1,
    });

    return insertResult.raw[0] as RecordListEntryRecord;
  }

  async removeRecordFromList({
    recordListId,
    entryId,
    workspaceId,
  }: {
    recordListId: string;
    entryId: string;
    workspaceId: string;
  }): Promise<RecordListEntryRecord> {
    const { entryObjectMetadataNameSingular } =
      await this.resolveRecordListObjectNames({ recordListId, workspaceId });
    const entryRepository =
      this.workspaceOrmManager.getRepository<RecordListEntryRecord>(
        entryObjectMetadataNameSingular,
        { shouldBypassPermissionChecks: true },
      );
    const entry = await entryRepository.findOneBy({ id: entryId });

    if (entry === null) {
      throw new RecordListException(
        'Record list entry not found',
        RecordListExceptionCode.RECORD_LIST_ENTRY_NOT_FOUND,
      );
    }

    await entryRepository.delete(entryId);

    return entry;
  }

  private async resolveRecordListObjectNames({
    recordListId,
    workspaceId,
  }: {
    recordListId: string;
    workspaceId: string;
  }): Promise<{
    parentObjectMetadataNameSingular: string;
    entryObjectMetadataNameSingular: string;
  }> {
    const recordList = await this.findOneOrThrow({
      id: recordListId,
      workspaceId,
    });
    const [parentObjectMetadata, entryObjectMetadata] = await Promise.all([
      this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
        where: { id: recordList.parentObjectMetadataId },
      }),
      this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
        where: { id: recordList.entryObjectMetadataId },
      }),
    ]);

    if (parentObjectMetadata === null || entryObjectMetadata === null) {
      throw new RecordListException(
        'Record list object metadata is incomplete',
        RecordListExceptionCode.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      parentObjectMetadataNameSingular: parentObjectMetadata.nameSingular,
      entryObjectMetadataNameSingular: entryObjectMetadata.nameSingular,
    };
  }
}
