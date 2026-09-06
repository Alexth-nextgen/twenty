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

@Injectable()
export class RecordListService {
  constructor(
    @InjectWorkspaceScopedRepository(RecordListEntity)
    private readonly recordListRepository: WorkspaceScopedRepository<RecordListEntity>,
    private readonly objectMetadataService: ObjectMetadataService,
    private readonly fieldMetadataService: FieldMetadataService,
  ) {}

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
        position: 0,
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
}
