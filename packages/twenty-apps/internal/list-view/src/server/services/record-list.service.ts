import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  type ActorMetadata,
  FieldActorSource,
  FieldMetadataType,
  ViewKey,
  ViewType,
  ViewVisibility,
} from 'twenty-shared/types';
import { isDefined, isPlainObject } from 'twenty-shared/utils';
import { v4 } from 'uuid';
import { In } from 'typeorm';

import { type CreateFieldInput } from 'src/engine/core-modules/application/native-extension-host/api/engine/metadata-modules/field-metadata/dtos/create-field.input';
import { type UpdateFieldInput } from 'src/engine/core-modules/application/native-extension-host/api/engine/metadata-modules/field-metadata/dtos/update-field.input';
import { FieldMetadataService } from 'src/engine/core-modules/application/native-extension-host/api/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { ObjectMetadataService } from 'src/engine/core-modules/application/native-extension-host/api/engine/metadata-modules/object-metadata/object-metadata.service';
import {
  getRecordListTemplateFields,
  type RecordListTemplateKey,
} from '../constants/record-list-templates.constant';
import { type CreateRecordListTemplateFieldInput } from '../dtos/create-record-list-template-field.input';
import { RecordListEntity } from '../entities/record-list.entity';
import {
  RecordListException,
  RecordListExceptionCode,
} from '../record-list.exception';
import {
  buildRecordListEntryObjectInput,
  buildRecordListEntryObjectNames,
  buildRecordListSourceRecordFieldInput,
  buildRecordListDefaultStatusFieldInput,
} from '../utils/build-record-list-entry-object-input';
import { InjectWorkspaceScopedRepository } from 'src/engine/core-modules/application/native-extension-host/api/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/core-modules/application/native-extension-host/api/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { WorkspaceOrmManager } from 'src/engine/core-modules/application/native-extension-host/api/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/core-modules/application/native-extension-host/api/engine/twenty-orm/utils/build-system-auth-context.util';
import { getRecordListSelectOptionValue } from '../utils/get-record-list-select-option-value';
import { ViewEntity } from 'src/engine/core-modules/application/native-extension-host/api/engine/metadata-modules/view/entities/view.entity';
import { ViewFieldService } from 'src/engine/core-modules/application/native-extension-host/api/engine/metadata-modules/view-field/services/view-field.service';
import { ActorFromAuthContextService } from 'src/engine/core-modules/application/native-extension-host/api/engine/core-modules/actor/services/actor-from-auth-context.service';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/application/native-extension-host/api/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/application/native-extension-host/api/engine/core-modules/auth/types/workspace-auth-context.type';
import { ViewService } from 'src/engine/core-modules/application/native-extension-host/api/engine/metadata-modules/view/services/view.service';

type RecordListMembershipRecordEventBatch = {
  workspaceId: string;
  objectMetadata: { id: string };
  events: {
    recordId: string;
    properties: {
      updatedFields?: string[];
      after?: Record<string, unknown>;
    };
  }[];
};

export type RecordListEntryRecord = {
  id: string;
  sourceRecordId: string;
  position: number;
  status: string | null;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  createdAt: Date;
  updatedAt: Date;
  [fieldName: string]: unknown;
};

export type RecordListMembershipRecord = RecordListEntryRecord & {
  recordList: RecordListEntity;
  values: Record<string, unknown>;
};

const RECORD_LIST_ENTRY_EDITOR_FIELD_TYPES = new Set<FieldMetadataType>([
  FieldMetadataType.TEXT,
  FieldMetadataType.NUMBER,
  FieldMetadataType.DATE,
  FieldMetadataType.BOOLEAN,
  FieldMetadataType.SELECT,
]);

const SYSTEM_ACTOR: ActorMetadata = {
  source: FieldActorSource.SYSTEM,
  workspaceMemberId: null,
  name: 'System',
  context: {},
};

const SUPPORTED_RECORD_LIST_OBJECT_NAMES = new Set(['person', 'company']);
const RECORD_LIST_RELATION_FIELD_NAMES = new Set([
  'attachments',
  'listEntryLabel',
  'noteTargets',
  'ownerNotes',
  'sourceRecord',
  'status',
  'taskTargets',
  'timelineActivities',
]);
const RELATED_FIELD_NAME_PREFIX = 'relatedField';
const LIST_MEMBERSHIP_FIELD_NAME = 'listMembership';
const LIST_MEMBERSHIP_FIELD_LABEL = 'List Membership';
const getRecordListOptionValue = (recordListId: string) =>
  `LIST_${recordListId.replace(/-/g, '').toUpperCase()}`;

@Injectable()
export class RecordListService {
  constructor(
    @InjectWorkspaceScopedRepository(RecordListEntity)
    private readonly recordListRepository: WorkspaceScopedRepository<RecordListEntity>,
    private readonly objectMetadataService: ObjectMetadataService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    @InjectWorkspaceScopedRepository(ViewEntity)
    private readonly viewRepository: WorkspaceScopedRepository<ViewEntity>,
    private readonly viewFieldService: ViewFieldService,
    private readonly actorFromAuthContextService: ActorFromAuthContextService,
    private readonly viewService: ViewService,
  ) {}

  async findAll({ workspaceId }: { workspaceId: string }) {
    const recordLists = await this.recordListRepository.find(workspaceId, {
      order: { position: 'ASC', createdAt: 'ASC' },
    });

    await this.ensureListMembershipFields({ workspaceId });

    return recordLists;
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

    await this.ensureRecordListEntryObjectMetadata({
      recordList,
      workspaceId,
    });
    await this.ensureEntryDisplayNameField({ recordList, workspaceId });
    await this.ensureKanbanCardFields({ recordList, workspaceId });
    await this.refreshRelatedFieldValues({ recordList, workspaceId });

    return recordList;
  }

  async createRecordList({
    name,
    icon = null,
    parentObjectMetadataId,
    templateKey = null,
    templateFields = null,
    workspaceId,
    createdByUserWorkspaceId = null,
  }: {
    name: string;
    icon?: string | null;
    parentObjectMetadataId: string;
    templateKey?: RecordListTemplateKey | null;
    templateFields?: CreateRecordListTemplateFieldInput[] | null;
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

    if (
      !SUPPORTED_RECORD_LIST_OBJECT_NAMES.has(parentObjectMetadata.nameSingular)
    ) {
      throw new RecordListException(
        'Record lists can only be created for people or companies',
        RecordListExceptionCode.UNSUPPORTED_PARENT_OBJECT,
      );
    }

    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      throw new RecordListException(
        'List name cannot be empty',
        RecordListExceptionCode.UPDATE_FAILED,
      );
    }

    const recordListId = v4();
    const entryObjectMetadata =
      await this.objectMetadataService.createOneObject({
        createObjectInput: buildRecordListEntryObjectInput({
          recordListId,
          recordListName: trimmedName,
        }),
        workspaceId,
        shouldCreateObjectNavigationItems: false,
      });

    try {
      const sourceRecordFieldMetadata =
        await this.fieldMetadataService.createOneField({
          createFieldInput: buildRecordListSourceRecordFieldInput({
            entryObjectMetadataId: entryObjectMetadata.id,
            parentObjectMetadataId,
            parentObjectLabelSingular: parentObjectMetadata.labelSingular,
            recordListName: trimmedName,
          }),
          workspaceId,
        });

      const hasCustomTemplateFields = isDefined(templateFields);
      const listFieldInputs = hasCustomTemplateFields
        ? templateFields.map((field) => {
            const optionValues: string[] = [];
            const options =
              field.type === FieldMetadataType.SELECT
                ? (field.options ?? []).map((option, position) => {
                    const value = getRecordListSelectOptionValue(
                      option.label,
                      optionValues,
                    );

                    optionValues.push(value);

                    return {
                      id: v4(),
                      label: option.label,
                      value,
                      color: option.color,
                      position,
                    };
                  })
                : undefined;

            return {
              type: field.type as FieldMetadataType,
              name: field.name,
              label: field.label,
              icon: field.icon ?? 'IconTextSize',
              isNullable: true,
              isUnique: false,
              ...(isDefined(options)
                ? {
                    options,
                    ...(field.name === 'status' && options[0]
                      ? { defaultValue: `'${options[0].value}'` }
                      : {}),
                  }
                : {}),
              objectMetadataId: entryObjectMetadata.id,
            };
          })
        : templateKey === null
          ? [
              buildRecordListDefaultStatusFieldInput({
                entryObjectMetadataId: entryObjectMetadata.id,
              }),
            ]
          : getRecordListTemplateFields(templateKey).map((fieldInput) => ({
              ...fieldInput,
              objectMetadataId: entryObjectMetadata.id,
            }));
      const listFieldMetadataItems = [];

      for (const listFieldInput of listFieldInputs) {
        listFieldMetadataItems.push(
          await this.fieldMetadataService.createOneField({
            createFieldInput: listFieldInput,
            workspaceId,
          }),
        );
      }

      await this.configureDefaultListView({
        entryObjectMetadataId: entryObjectMetadata.id,
        sourceRecordFieldMetadataId: sourceRecordFieldMetadata.id,
        listFieldMetadataIds: listFieldMetadataItems.map(
          (fieldMetadata) => fieldMetadata.id,
        ),
        workspaceId,
      });

      const templateDefaultViewId =
        templateKey === null && !hasCustomTemplateFields
          ? null
          : await this.createTemplateKanbanView({
              entryObjectMetadataId: entryObjectMetadata.id,
              statusFieldMetadataId:
                listFieldMetadataItems.find(
                  (fieldMetadata) => fieldMetadata.name === 'status',
                )?.id ?? null,
              workspaceId,
              createdByUserWorkspaceId,
            });

      const recordList = await this.recordListRepository.insertAndReturnOne(
        workspaceId,
        {
          id: recordListId,
          name: trimmedName,
          icon,
          position:
            ((await this.recordListRepository.maximum(
              workspaceId,
              'position',
            )) ?? -1) + 1,
          parentObjectMetadataId,
          entryObjectMetadataId: entryObjectMetadata.id,
          defaultViewId: templateDefaultViewId,
          createdByUserWorkspaceId,
        },
      );

      await this.syncListMembershipFieldOptions({
        parentObjectMetadataId,
        workspaceId,
      });

      return recordList;
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
    defaultViewId,
    workspaceId,
  }: {
    id: string;
    name?: string;
    icon?: string | null;
    position?: number;
    defaultViewId?: string | null;
    workspaceId: string;
  }) {
    const recordList = await this.findOneOrThrow({ id, workspaceId });

    if (defaultViewId !== undefined && defaultViewId !== null) {
      const defaultView = await this.viewRepository.findOneBy(workspaceId, {
        id: defaultViewId,
        objectMetadataId: recordList.entryObjectMetadataId,
      });

      if (defaultView === null) {
        throw new RecordListException(
          'Default view does not belong to the record list entry object',
          RecordListExceptionCode.DEFAULT_VIEW_NOT_FOUND,
        );
      }
    }

    if (name !== undefined && name.trim().length === 0) {
      throw new RecordListException(
        'List name cannot be empty',
        RecordListExceptionCode.UPDATE_FAILED,
      );
    }

    await this.recordListRepository.update(
      workspaceId,
      { id },
      {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(icon !== undefined ? { icon } : {}),
        ...(position !== undefined ? { position } : {}),
        ...(defaultViewId !== undefined ? { defaultViewId } : {}),
      },
    );

    if (name !== undefined && name.trim() !== recordList.name) {
      await this.synchronizeRecordListLabels({
        recordList,
        name: name.trim(),
        workspaceId,
      });

      await this.syncListMembershipFieldOptions({
        parentObjectMetadataId: recordList.parentObjectMetadataId,
        workspaceId,
      });
    }

    return await this.findOneOrThrow({ id, workspaceId });
  }

  async reorderRecordLists({
    ids,
    workspaceId,
  }: {
    ids: string[];
    workspaceId: string;
  }) {
    const recordLists = await this.findAll({ workspaceId });
    const recordListIds = new Set(
      recordLists.map((recordList) => recordList.id),
    );

    if (
      ids.length !== recordLists.length ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !recordListIds.has(id))
    ) {
      throw new RecordListException(
        'List order must contain every workspace list exactly once',
        RecordListExceptionCode.UPDATE_FAILED,
      );
    }

    await Promise.all(
      ids.map((id, position) =>
        this.recordListRepository.update(workspaceId, { id }, { position }),
      ),
    );

    return await this.findAll({ workspaceId });
  }

  async deleteRecordList({
    id,
    workspaceId,
  }: {
    id: string;
    workspaceId: string;
  }) {
    const recordList = await this.findOneOrThrow({ id, workspaceId });
    const entries = await this.findRecordListEntries({
      recordListId: id,
      workspaceId,
    });

    await this.objectMetadataService.deleteOneObject({
      deleteObjectInput: { id: recordList.entryObjectMetadataId },
      workspaceId,
    });

    await this.syncListMembershipFieldValues({
      recordListId: id,
      parentObjectMetadataId: recordList.parentObjectMetadataId,
      sourceRecordIds: entries.map(({ sourceRecordId }) => sourceRecordId),
      isMember: false,
      workspaceId,
    });
    await this.syncListMembershipFieldOptions({
      parentObjectMetadataId: recordList.parentObjectMetadataId,
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
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const entryRepository =
        this.workspaceOrmManager.getRepository<RecordListEntryRecord>(
          entryObjectMetadataNameSingular,
          { shouldBypassPermissionChecks: true },
        );

      return await entryRepository.find({
        order: { position: 'ASC', createdAt: 'ASC' },
      });
    }, buildSystemAuthContext(workspaceId));
  }

  async findRecordListEntryForEditing({
    entryObjectMetadataId,
    entryId,
    workspaceId,
  }: {
    entryObjectMetadataId: string;
    entryId: string;
    workspaceId: string;
  }) {
    const recordList = await this.recordListRepository.findOneBy(workspaceId, {
      entryObjectMetadataId,
    });

    if (!recordList) {
      throw new RecordListException(
        'Record list not found',
        RecordListExceptionCode.RECORD_LIST_NOT_FOUND,
      );
    }

    const { entryObjectMetadataNameSingular } =
      await this.resolveRecordListObjectNames({
        recordListId: recordList.id,
        workspaceId,
      });
    const fields = await this.getEditableRecordListEntryFields({
      entryObjectMetadataId,
      workspaceId,
    });

    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const entryRepository =
        this.workspaceOrmManager.getRepository<RecordListEntryRecord>(
          entryObjectMetadataNameSingular,
          { shouldBypassPermissionChecks: true },
        );
      const entry = await entryRepository.findOneBy({ id: entryId });

      if (!entry) {
        throw new RecordListException(
          'Record list entry not found',
          RecordListExceptionCode.RECORD_LIST_ENTRY_NOT_FOUND,
        );
      }

      return {
        fields: fields.map((field) => ({
          name: field.name,
          label: field.label,
          type: field.type,
          options: (field.options ?? [])
            .filter(
              (option) =>
                typeof option.label === 'string' &&
                typeof option.value === 'string',
            )
            .map(({ label, value }) => ({ label, value })),
        })),
        values: Object.fromEntries(
          fields.map((field) => [field.name, entry[field.name] ?? null]),
        ),
      };
    }, buildSystemAuthContext(workspaceId));
  }

  async updateRecordListEntryFields({
    entryObjectMetadataId,
    entryId,
    data,
    workspaceId,
  }: {
    entryObjectMetadataId: string;
    entryId: string;
    data: Record<string, unknown>;
    workspaceId: string;
  }): Promise<RecordListEntryRecord> {
    if (!isPlainObject(data)) {
      throw new RecordListException(
        'The list entry values are not valid',
        RecordListExceptionCode.UPDATE_FAILED,
      );
    }

    const recordList = await this.recordListRepository.findOneBy(workspaceId, {
      entryObjectMetadataId,
    });

    if (!recordList) {
      throw new RecordListException(
        'Record list not found',
        RecordListExceptionCode.RECORD_LIST_NOT_FOUND,
      );
    }

    const { entryObjectMetadataNameSingular } =
      await this.resolveRecordListObjectNames({
        recordListId: recordList.id,
        workspaceId,
      });
    const editableFields = await this.getEditableRecordListEntryFields({
      entryObjectMetadataId,
      workspaceId,
    });
    const editableFieldByName = new Map(
      editableFields.map((field) => [field.name, field]),
    );
    const normalizedData = Object.fromEntries(
      Object.entries(data).map(([fieldName, value]) => {
        const field = editableFieldByName.get(fieldName);

        if (!field) {
          throw new RecordListException(
            'This list field cannot be changed',
            RecordListExceptionCode.SYSTEM_FIELD_NOT_EDITABLE,
          );
        }

        if (value === null) {
          return [fieldName, null];
        }

        if (
          field.type === FieldMetadataType.NUMBER &&
          typeof value === 'number' &&
          Number.isFinite(value)
        ) {
          return [fieldName, value];
        }

        if (
          field.type === FieldMetadataType.BOOLEAN &&
          typeof value === 'boolean'
        ) {
          return [fieldName, value];
        }

        if (
          (field.type === FieldMetadataType.TEXT ||
            field.type === FieldMetadataType.DATE ||
            field.type === FieldMetadataType.SELECT) &&
          typeof value === 'string'
        ) {
          if (
            field.type === FieldMetadataType.SELECT &&
            !field.options?.some((option) => option.value === value)
          ) {
            throw new RecordListException(
              'The selected value is not available for this field',
              RecordListExceptionCode.UPDATE_FAILED,
            );
          }

          return [fieldName, value];
        }

        throw new RecordListException(
          'The value is not valid for this field',
          RecordListExceptionCode.UPDATE_FAILED,
        );
      }),
    );

    const entry = await this.workspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const entryRepository =
          this.workspaceOrmManager.getRepository<RecordListEntryRecord>(
            entryObjectMetadataNameSingular,
            { shouldBypassPermissionChecks: true },
          );
        const entry = await entryRepository.findOneBy({ id: entryId });

        if (!entry) {
          throw new RecordListException(
            'Record list entry not found',
            RecordListExceptionCode.RECORD_LIST_ENTRY_NOT_FOUND,
          );
        }

        if (Object.keys(normalizedData).length === 0) {
          return entry;
        }

        await entryRepository.update({ id: entryId }, normalizedData);

        return (await entryRepository.findOneBy({ id: entryId })) ?? entry;
      },
      buildSystemAuthContext(workspaceId),
    );

    return entry;
  }

  async findRecordListMembershipsForRecord({
    sourceRecordId,
    parentObjectMetadataId,
    workspaceId,
  }: {
    sourceRecordId: string;
    parentObjectMetadataId: string;
    workspaceId: string;
  }): Promise<RecordListMembershipRecord[]> {
    const allLists = await this.findAll({ workspaceId });
    const matchingLists = allLists.filter(
      (list) => list.parentObjectMetadataId === parentObjectMetadataId,
    );

    if (matchingLists.length === 0) {
      return [];
    }

    const entryObjectMetadataItems =
      await this.objectMetadataService.findManyWithinWorkspace(workspaceId, {
        where: {
          id: In(
            matchingLists.map((recordList) => recordList.entryObjectMetadataId),
          ),
        },
      });
    const entryObjectMetadataById = new Map(
      entryObjectMetadataItems.map((objectMetadataItem) => [
        objectMetadataItem.id,
        objectMetadataItem,
      ]),
    );

    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const membershipsByList = await Promise.all(
        matchingLists.map(async (recordList) => {
          const entryObjectMetadata = entryObjectMetadataById.get(
            recordList.entryObjectMetadataId,
          );

          if (!isDefined(entryObjectMetadata)) {
            throw new RecordListException(
              'Record list entry object metadata is incomplete',
              RecordListExceptionCode.INTERNAL_SERVER_ERROR,
            );
          }

          const entryRepository =
            this.workspaceOrmManager.getRepository<RecordListEntryRecord>(
              entryObjectMetadata.nameSingular,
              { shouldBypassPermissionChecks: true },
            );
          const entries = await entryRepository.find({
            where: { sourceRecordId },
            order: { position: 'ASC', createdAt: 'ASC' },
          });

          return entries.map((entry) => ({
            ...entry,
            recordList,
            values: this.getRecordListEntryValues(entry),
          }));
        }),
      );

      return membershipsByList.flat();
    }, buildSystemAuthContext(workspaceId));
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
      parentObjectMetadataId,
    } = await this.resolveRecordListObjectNames({ recordListId, workspaceId });
    const entryActorFields = await this.getEntryActorFields({
      entryObjectMetadataNameSingular,
      workspaceId,
    });
    const relatedFieldMappings = await this.getRelatedFieldMappings({
      recordListId,
      workspaceId,
    });

    const entry = await this.workspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const parentRepository = this.workspaceOrmManager.getRepository(
          parentObjectMetadataNameSingular,
          { shouldBypassPermissionChecks: true },
        );

        if (!(await parentRepository.existsBy({ id: sourceRecordId }))) {
          throw new RecordListException(
            'Source record does not exist or does not belong to the list object',
            RecordListExceptionCode.SOURCE_RECORD_NOT_FOUND,
          );
        }

        const entryRepository =
          this.workspaceOrmManager.getRepository<RecordListEntryRecord>(
            entryObjectMetadataNameSingular,
            { shouldBypassPermissionChecks: true },
          );
        const existingEntry = await entryRepository.findOneBy({
          sourceRecordId,
        });

        if (existingEntry !== null) {
          return existingEntry;
        }

        const position = (await entryRepository.maximum('position')) ?? -1;
        const [sourceRecord] = await parentRepository.findBy({
          id: sourceRecordId,
        });
        const insertResult = await entryRepository.insert({
          ...entryActorFields,
          sourceRecordId,
          ...this.getRelatedFieldValues(sourceRecord, relatedFieldMappings),
          listEntryLabel: await this.getSourceRecordLabel({
            sourceRecord,
            parentObjectMetadataId,
            workspaceId,
          }),
          position: position + 1,
        });

        return insertResult.raw[0] as RecordListEntryRecord;
      },
      buildSystemAuthContext(workspaceId),
    );

    await this.syncListMembershipFieldValues({
      recordListId,
      parentObjectMetadataId,
      sourceRecordIds: [sourceRecordId],
      isMember: true,
      workspaceId,
    });

    return entry;
  }

  async addRecordsToList({
    recordListId,
    sourceRecordIds,
    workspaceId,
  }: {
    recordListId: string;
    sourceRecordIds: string[];
    workspaceId: string;
  }): Promise<{ addedCount: number; skippedCount: number }> {
    const uniqueSourceRecordIds = [...new Set(sourceRecordIds)];
    const {
      parentObjectMetadataNameSingular,
      entryObjectMetadataNameSingular,
      parentObjectMetadataId,
    } = await this.resolveRecordListObjectNames({ recordListId, workspaceId });
    const entryActorFields = await this.getEntryActorFields({
      entryObjectMetadataNameSingular,
      workspaceId,
    });
    const relatedFieldMappings = await this.getRelatedFieldMappings({
      recordListId,
      workspaceId,
    });

    const result = await this.workspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const parentRepository = this.workspaceOrmManager.getRepository(
          parentObjectMetadataNameSingular,
          { shouldBypassPermissionChecks: true },
        );
        const sourceRecords = await parentRepository.findBy({
          id: In(uniqueSourceRecordIds),
        });

        if (sourceRecords.length !== uniqueSourceRecordIds.length) {
          throw new RecordListException(
            'One or more source records do not exist or do not belong to the list object',
            RecordListExceptionCode.SOURCE_RECORD_NOT_FOUND,
          );
        }

        const entryRepository =
          this.workspaceOrmManager.getRepository<RecordListEntryRecord>(
            entryObjectMetadataNameSingular,
            { shouldBypassPermissionChecks: true },
          );
        const existingEntries = await entryRepository.find({
          where: { sourceRecordId: In(uniqueSourceRecordIds) },
        });
        const existingSourceRecordIds = new Set(
          existingEntries.map((entry) => entry.sourceRecordId),
        );
        const sourceRecordIdsToAdd = uniqueSourceRecordIds.filter(
          (sourceRecordId) => !existingSourceRecordIds.has(sourceRecordId),
        );

        if (sourceRecordIdsToAdd.length === 0) {
          return {
            addedCount: 0,
            skippedCount: uniqueSourceRecordIds.length,
            addedSourceRecordIds: [],
          };
        }

        const maximumPosition =
          (await entryRepository.maximum('position')) ?? -1;

        const sourceRecordById = new Map(
          sourceRecords.map((record) => [record.id, record]),
        );
        const entriesToInsert = await Promise.all(
          sourceRecordIdsToAdd.map(async (sourceRecordId, index) => ({
            ...entryActorFields,
            sourceRecordId,
            ...this.getRelatedFieldValues(
              sourceRecordById.get(sourceRecordId),
              relatedFieldMappings,
            ),
            listEntryLabel: await this.getSourceRecordLabel({
              sourceRecord: sourceRecordById.get(sourceRecordId),
              parentObjectMetadataId,
              workspaceId,
            }),
            position: maximumPosition + index + 1,
          })),
        );

        await entryRepository.insert(entriesToInsert);

        return {
          addedCount: sourceRecordIdsToAdd.length,
          skippedCount:
            uniqueSourceRecordIds.length - sourceRecordIdsToAdd.length,
          addedSourceRecordIds: sourceRecordIdsToAdd,
        };
      },
      buildSystemAuthContext(workspaceId),
    );

    if (result.addedCount > 0) {
      await this.syncListMembershipFieldValues({
        recordListId,
        parentObjectMetadataId,
        sourceRecordIds: result.addedSourceRecordIds,
        isMember: true,
        workspaceId,
      });
    }

    return { addedCount: result.addedCount, skippedCount: result.skippedCount };
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
    const { entryObjectMetadataNameSingular, parentObjectMetadataId } =
      await this.resolveRecordListObjectNames({ recordListId, workspaceId });
    const entry = await this.workspaceOrmManager.executeInWorkspaceContext(
      async () => {
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
      },
      buildSystemAuthContext(workspaceId),
    );

    await this.syncListMembershipFieldValues({
      recordListId,
      parentObjectMetadataId,
      sourceRecordIds: [entry.sourceRecordId],
      isMember: false,
      workspaceId,
    });

    return entry;
  }

  async syncRecordListRelatedField({
    recordListId,
    sourceFieldMetadataId,
    sourceRecordId,
    workspaceId,
  }: {
    recordListId: string;
    sourceFieldMetadataId: string;
    sourceRecordId?: string;
    workspaceId: string;
  }): Promise<boolean> {
    const recordList = await this.recordListRepository.findOneBy(workspaceId, {
      id: recordListId,
    });

    if (recordList === null) {
      throw new RecordListException(
        'Record list not found in workspace',
        RecordListExceptionCode.RECORD_LIST_NOT_FOUND,
      );
    }

    const sourceField = await this.findFieldMetadataWithinWorkspace({
      workspaceId,
      fieldMetadataId: sourceFieldMetadataId,
      objectMetadataId: recordList.parentObjectMetadataId,
    });

    if (
      !sourceField ||
      sourceField.type === FieldMetadataType.RELATION ||
      sourceField.type === FieldMetadataType.MORPH_RELATION
    ) {
      throw new RecordListException(
        'Related list attributes must be scalar fields on the list source object',
        RecordListExceptionCode.RECORD_LIST_FIELD_NOT_FOUND,
      );
    }

    await this.refreshRelatedFieldValues({
      recordList,
      workspaceId,
      onlySourceFieldMetadataId: sourceFieldMetadataId,
      onlySourceRecordId: sourceRecordId,
    });

    return true;
  }

  private async getRelatedFieldMappings({
    recordListId,
    workspaceId,
  }: {
    recordListId: string;
    workspaceId: string;
  }) {
    const recordList = await this.recordListRepository.findOneBy(workspaceId, {
      id: recordListId,
    });

    if (recordList === null) {
      return [];
    }

    const [entryFields, sourceFields] = await Promise.all([
      this.fieldMetadataService.findManyWithinWorkspace({
        workspaceId,
        objectMetadataId: recordList.entryObjectMetadataId,
        limit: 100,
      }),
      this.fieldMetadataService.findManyWithinWorkspace({
        workspaceId,
        objectMetadataId: recordList.parentObjectMetadataId,
        limit: 100,
      }),
    ]);
    const sourceFieldsByCompactId = new Map(
      sourceFields.map((field) => [field.id.replace(/-/g, ''), field]),
    );

    return entryFields.flatMap((entryField) => {
      if (!entryField.name.startsWith(RELATED_FIELD_NAME_PREFIX)) {
        return [];
      }

      const sourceField = sourceFieldsByCompactId.get(
        entryField.name.slice(RELATED_FIELD_NAME_PREFIX.length),
      );

      return isDefined(sourceField)
        ? [
            {
              entryFieldName: entryField.name,
              sourceFieldName: sourceField.name,
            },
          ]
        : [];
    });
  }

  private getRelatedFieldValues(
    sourceRecord: Record<string, unknown> | undefined,
    fieldMappings: Array<{
      entryFieldName: string;
      sourceFieldName: string;
    }>,
  ) {
    return Object.fromEntries(
      fieldMappings.map(({ entryFieldName, sourceFieldName }) => [
        entryFieldName,
        sourceRecord?.[sourceFieldName] ?? null,
      ]),
    );
  }

  private async refreshRelatedFieldValues({
    recordList,
    workspaceId,
    onlySourceFieldMetadataId,
    onlySourceRecordId,
  }: {
    recordList: RecordListEntity;
    workspaceId: string;
    onlySourceFieldMetadataId?: string;
    onlySourceRecordId?: string;
  }) {
    const allFieldMappings = await this.getRelatedFieldMappings({
      recordListId: recordList.id,
      workspaceId,
    });
    const compactSourceFieldId = onlySourceFieldMetadataId?.replace(/-/g, '');
    const fieldMappings = isDefined(compactSourceFieldId)
      ? allFieldMappings.filter((fieldMapping) =>
          fieldMapping.entryFieldName.endsWith(compactSourceFieldId),
        )
      : allFieldMappings;

    if (fieldMappings.length === 0) {
      return;
    }

    const entryObjectMetadata =
      await this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
        where: { id: recordList.entryObjectMetadataId },
      });

    if (!entryObjectMetadata) {
      return;
    }

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const entryRepository =
        this.workspaceOrmManager.getRepository<RecordListEntryRecord>(
          entryObjectMetadata.nameSingular,
          { shouldBypassPermissionChecks: true },
        );
      const entries = await entryRepository.find(
        isDefined(onlySourceRecordId)
          ? { where: { sourceRecordId: onlySourceRecordId } }
          : {},
      );

      if (entries.length === 0) {
        return;
      }

      const parentObjectMetadata =
        await this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
          where: { id: recordList.parentObjectMetadataId },
        });

      if (!parentObjectMetadata) {
        return;
      }

      const sourceRecords = await this.workspaceOrmManager
        .getRepository<Record<string, unknown> & { id: string }>(
          parentObjectMetadata.nameSingular,
          { shouldBypassPermissionChecks: true },
        )
        .findBy({ id: In(entries.map((entry) => entry.sourceRecordId)) });
      const sourceRecordsById = new Map(
        sourceRecords.map((sourceRecord) => [sourceRecord.id, sourceRecord]),
      );

      for (const entry of entries) {
        const sourceRecord = sourceRecordsById.get(entry.sourceRecordId);

        if (!sourceRecord) {
          continue;
        }

        const updatedValues = this.getRelatedFieldValues(
          sourceRecord,
          fieldMappings,
        );
        const hasChangedValue = Object.entries(updatedValues).some(
          ([fieldName, value]) =>
            JSON.stringify(entry[fieldName] ?? null) !==
            JSON.stringify(value ?? null),
        );

        if (hasChangedValue) {
          await entryRepository.update({ id: entry.id }, updatedValues);
        }
      }
    }, buildSystemAuthContext(workspaceId));
  }

  async removeRecordsFromList({
    recordListId,
    entryIds,
    workspaceId,
  }: {
    recordListId: string;
    entryIds: string[];
    workspaceId: string;
  }): Promise<{ removedCount: number; skippedCount: number }> {
    const { entryObjectMetadataNameSingular, parentObjectMetadataId } =
      await this.resolveRecordListObjectNames({ recordListId, workspaceId });
    const uniqueEntryIds = [...new Set(entryIds)];

    if (uniqueEntryIds.length === 0) {
      return { removedCount: 0, skippedCount: 0 };
    }

    const result = await this.workspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const entryRepository =
          this.workspaceOrmManager.getRepository<RecordListEntryRecord>(
            entryObjectMetadataNameSingular,
            { shouldBypassPermissionChecks: true },
          );
        const entries = await entryRepository.findBy({
          id: In(uniqueEntryIds),
        });

        if (entries.length > 0) {
          await entryRepository.delete({ id: In(entries.map(({ id }) => id)) });
        }

        return {
          removedCount: entries.length,
          skippedCount: uniqueEntryIds.length - entries.length,
          removedSourceRecordIds: entries.map(
            ({ sourceRecordId }) => sourceRecordId,
          ),
        };
      },
      buildSystemAuthContext(workspaceId),
    );

    if (result.removedSourceRecordIds.length > 0) {
      await this.syncListMembershipFieldValues({
        recordListId,
        parentObjectMetadataId,
        sourceRecordIds: result.removedSourceRecordIds,
        isMember: false,
        workspaceId,
      });
    }

    return {
      removedCount: result.removedCount,
      skippedCount: result.skippedCount,
    };
  }

  async removeRecordsFromListBySourceRecordIds({
    recordListId,
    sourceRecordIds,
    workspaceId,
  }: {
    recordListId: string;
    sourceRecordIds: string[];
    workspaceId: string;
  }): Promise<{ removedCount: number; skippedCount: number }> {
    const { entryObjectMetadataNameSingular, parentObjectMetadataId } =
      await this.resolveRecordListObjectNames({ recordListId, workspaceId });
    const uniqueSourceRecordIds = [...new Set(sourceRecordIds)];

    if (uniqueSourceRecordIds.length === 0) {
      return { removedCount: 0, skippedCount: 0 };
    }

    const result = await this.workspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const entryRepository =
          this.workspaceOrmManager.getRepository<RecordListEntryRecord>(
            entryObjectMetadataNameSingular,
            { shouldBypassPermissionChecks: true },
          );
        const entries = await entryRepository.findBy({
          sourceRecordId: In(uniqueSourceRecordIds),
        });

        if (entries.length > 0) {
          await entryRepository.delete({
            id: In(entries.map(({ id }) => id)),
          });
        }

        const removedSourceRecordIds = new Set(
          entries.map(({ sourceRecordId }) => sourceRecordId),
        );

        return {
          removedCount: entries.length,
          skippedCount: uniqueSourceRecordIds.filter(
            (sourceRecordId) => !removedSourceRecordIds.has(sourceRecordId),
          ).length,
          removedSourceRecordIds: [...removedSourceRecordIds],
        };
      },
      buildSystemAuthContext(workspaceId),
    );

    if (result.removedSourceRecordIds.length > 0) {
      await this.syncListMembershipFieldValues({
        recordListId,
        parentObjectMetadataId,
        sourceRecordIds: result.removedSourceRecordIds,
        isMember: false,
        workspaceId,
      });
    }

    return {
      removedCount: result.removedCount,
      skippedCount: result.skippedCount,
    };
  }

  @OnEvent('person.updated', { async: true })
  async synchronizePersonListMembershipFromField(
    eventBatch: RecordListMembershipRecordEventBatch,
  ) {
    await this.synchronizeListMembershipFromFieldEvent(eventBatch);
  }

  @OnEvent('company.updated', { async: true })
  async synchronizeCompanyListMembershipFromField(
    eventBatch: RecordListMembershipRecordEventBatch,
  ) {
    await this.synchronizeListMembershipFromFieldEvent(eventBatch);
  }

  @OnEvent('person.created', { async: true })
  async synchronizeCreatedPersonListMembershipFromField(
    eventBatch: RecordListMembershipRecordEventBatch,
  ) {
    await this.synchronizeListMembershipFromFieldEvent(eventBatch);
  }

  @OnEvent('company.created', { async: true })
  async synchronizeCreatedCompanyListMembershipFromField(
    eventBatch: RecordListMembershipRecordEventBatch,
  ) {
    await this.synchronizeListMembershipFromFieldEvent(eventBatch);
  }

  private async synchronizeListMembershipFromFieldEvent(
    eventBatch: RecordListMembershipRecordEventBatch,
  ) {
    const fieldMetadataItems =
      await this.fieldMetadataService.findManyWithinWorkspace({
        workspaceId: eventBatch.workspaceId,
        objectMetadataId: eventBatch.objectMetadata.id,
        limit: 1000,
      });
    const membershipField = fieldMetadataItems.find(
      ({ name }) => name === LIST_MEMBERSHIP_FIELD_NAME,
    );

    if (!membershipField) {
      return;
    }

    const recordLists = await this.recordListRepository.find(
      eventBatch.workspaceId,
      {
        where: { parentObjectMetadataId: eventBatch.objectMetadata.id },
      },
    );
    const recordListIdByOptionValue = new Map(
      recordLists.map(({ id }) => [getRecordListOptionValue(id), id]),
    );

    for (const event of eventBatch.events) {
      if (
        (event.properties.updatedFields !== undefined &&
          !event.properties.updatedFields.includes(membershipField.name)) ||
        !isPlainObject(event.properties.after) ||
        !(membershipField.name in event.properties.after)
      ) {
        continue;
      }

      const membershipValue = event.properties.after[membershipField.name];
      const selectedRecordListOptionValues = new Set(
        Array.isArray(membershipValue)
          ? membershipValue.filter(
              (value): value is string =>
                typeof value === 'string' &&
                recordListIdByOptionValue.has(value),
            )
          : [],
      );
      const selectedRecordListIds = new Set(
        [...selectedRecordListOptionValues]
          .map((optionValue) => recordListIdByOptionValue.get(optionValue))
          .filter((recordListId): recordListId is string =>
            isDefined(recordListId),
          ),
      );

      const currentRecordListIds =
        await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
          const currentRecordListIds = new Set<string>();

          for (const recordList of recordLists) {
            const entryObject =
              await this.objectMetadataService.findOneWithinWorkspace(
                eventBatch.workspaceId,
                { where: { id: recordList.entryObjectMetadataId } },
              );

            if (!entryObject) {
              continue;
            }

            const entryRepository =
              this.workspaceOrmManager.getRepository<RecordListEntryRecord>(
                entryObject.nameSingular,
                { shouldBypassPermissionChecks: true },
              );
            if (
              await entryRepository.existsBy({ sourceRecordId: event.recordId })
            ) {
              currentRecordListIds.add(recordList.id);
            }
          }

          return [...currentRecordListIds];
        }, buildSystemAuthContext(eventBatch.workspaceId));

      const currentRecordListIdSet = new Set(currentRecordListIds);
      const recordListIdsToAdd = [...selectedRecordListIds].filter(
        (recordListId) => !currentRecordListIdSet.has(recordListId),
      );
      const recordListIdsToRemove = currentRecordListIds.filter(
        (recordListId) => !selectedRecordListIds.has(recordListId),
      );

      for (const recordListId of recordListIdsToAdd) {
        await this.addRecordsToList({
          recordListId,
          sourceRecordIds: [event.recordId],
          workspaceId: eventBatch.workspaceId,
        });
      }

      for (const recordListId of recordListIdsToRemove) {
        await this.removeRecordsFromListBySourceRecordIds({
          recordListId,
          sourceRecordIds: [event.recordId],
          workspaceId: eventBatch.workspaceId,
        });
      }
    }
  }

  private async ensureListMembershipFields({
    workspaceId,
  }: {
    workspaceId: string;
  }) {
    const parentObjects =
      await this.objectMetadataService.findManyWithinWorkspace(workspaceId, {
        where: { nameSingular: In([...SUPPORTED_RECORD_LIST_OBJECT_NAMES]) },
      });

    for (const parentObject of parentObjects) {
      await this.syncListMembershipFieldOptions({
        parentObjectMetadataId: parentObject.id,
        workspaceId,
      });
    }
  }

  private async syncListMembershipFieldOptions({
    parentObjectMetadataId,
    workspaceId,
  }: {
    parentObjectMetadataId: string;
    workspaceId: string;
  }) {
    const [fieldMetadataItems, recordLists] = await Promise.all([
      this.fieldMetadataService.findManyWithinWorkspace({
        workspaceId,
        objectMetadataId: parentObjectMetadataId,
        limit: 1000,
      }),
      this.recordListRepository.find(workspaceId, {
        where: { parentObjectMetadataId },
        order: { position: 'ASC', createdAt: 'ASC' },
      }),
    ]);
    const existingField = fieldMetadataItems.find(
      ({ name }) => name === LIST_MEMBERSHIP_FIELD_NAME,
    );
    const existingOptions = existingField?.options ?? [];
    const existingOptionsByValue = new Map(
      existingOptions.map((option) => [option.value, option]),
    );
    const options = recordLists.map((recordList, position) => ({
      id:
        existingOptionsByValue.get(getRecordListOptionValue(recordList.id))
          ?.id ?? v4(),
      label: recordList.name,
      value: getRecordListOptionValue(recordList.id),
      color: 'blue',
      position,
    }));

    if (options.length === 0) {
      if (existingField) {
        await this.fieldMetadataService.deleteOneField({
          deleteOneFieldInput: { id: existingField.id },
          workspaceId,
        });
      }

      return;
    }

    let didCreateField = false;

    if (!existingField) {
      await this.fieldMetadataService.createOneField({
        createFieldInput: {
          type: FieldMetadataType.MULTI_SELECT,
          name: LIST_MEMBERSHIP_FIELD_NAME,
          label: LIST_MEMBERSHIP_FIELD_LABEL,
          icon: 'IconList',
          objectMetadataId: parentObjectMetadataId,
          isNullable: true,
          isUnique: false,
          options,
        },
        workspaceId,
      });
      didCreateField = true;
    } else if (
      JSON.stringify(
        existingOptions.map(({ value, label, position }) => ({
          value,
          label,
          position,
        })),
      ) !==
      JSON.stringify(
        options.map(({ value, label, position }) => ({
          value,
          label,
          position,
        })),
      )
    ) {
      await this.fieldMetadataService.updateOneField({
        updateFieldInput: { id: existingField.id, options },
        workspaceId,
      });
    }

    if (didCreateField) {
      await this.backfillListMembershipFieldValues({
        parentObjectMetadataId,
        recordLists,
        workspaceId,
      });
    }
  }

  private async backfillListMembershipFieldValues({
    parentObjectMetadataId,
    recordLists,
    workspaceId,
  }: {
    parentObjectMetadataId: string;
    recordLists: RecordListEntity[];
    workspaceId: string;
  }) {
    const parentObject =
      await this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
        where: { id: parentObjectMetadataId },
      });

    if (!parentObject) {
      return;
    }

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const membershipIdsByRecordId = new Map<string, string[]>();

      for (const recordList of recordLists) {
        const entryObject =
          await this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
            where: { id: recordList.entryObjectMetadataId },
          });

        if (!entryObject) {
          continue;
        }

        const entryRepository =
          this.workspaceOrmManager.getRepository<RecordListEntryRecord>(
            entryObject.nameSingular,
            { shouldBypassPermissionChecks: true },
          );
        const entries = await entryRepository.find({
          select: { sourceRecordId: true },
        });

        for (const { sourceRecordId } of entries) {
          membershipIdsByRecordId.set(sourceRecordId, [
            ...(membershipIdsByRecordId.get(sourceRecordId) ?? []),
            getRecordListOptionValue(recordList.id),
          ]);
        }
      }

      const parentRepository = this.workspaceOrmManager.getRepository(
        parentObject.nameSingular,
        { shouldBypassPermissionChecks: true },
        { shouldSkipEventEmission: true },
      );

      for (const [recordId, recordListIds] of membershipIdsByRecordId) {
        await parentRepository.update(
          { id: recordId },
          { [LIST_MEMBERSHIP_FIELD_NAME]: recordListIds },
        );
      }
    }, buildSystemAuthContext(workspaceId));
  }

  private async syncListMembershipFieldValues({
    recordListId,
    parentObjectMetadataId,
    sourceRecordIds,
    isMember,
    workspaceId,
  }: {
    recordListId: string;
    parentObjectMetadataId: string;
    sourceRecordIds: string[];
    isMember: boolean;
    workspaceId: string;
  }) {
    if (sourceRecordIds.length === 0) {
      return;
    }

    await this.syncListMembershipFieldOptions({
      parentObjectMetadataId,
      workspaceId,
    });

    const [parentObject, fieldMetadataItems] = await Promise.all([
      this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
        where: { id: parentObjectMetadataId },
      }),
      this.fieldMetadataService.findManyWithinWorkspace({
        workspaceId,
        objectMetadataId: parentObjectMetadataId,
        limit: 1000,
      }),
    ]);
    const membershipField = fieldMetadataItems.find(
      ({ name }) => name === LIST_MEMBERSHIP_FIELD_NAME,
    );

    if (!parentObject || !membershipField) {
      return;
    }

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const parentRepository = this.workspaceOrmManager.getRepository<
        Record<string, unknown> & { id: string }
      >(
        parentObject.nameSingular,
        { shouldBypassPermissionChecks: true },
        { shouldSkipEventEmission: true },
      );
      const sourceRecords = await parentRepository.findBy({
        id: In([...new Set(sourceRecordIds)]),
      });

      for (const sourceRecord of sourceRecords) {
        const currentMemberships = Array.isArray(
          sourceRecord[LIST_MEMBERSHIP_FIELD_NAME],
        )
          ? (sourceRecord[LIST_MEMBERSHIP_FIELD_NAME] as string[])
          : [];
        const nextMemberships = new Set(currentMemberships);

        if (isMember) {
          nextMemberships.add(getRecordListOptionValue(recordListId));
        } else {
          nextMemberships.delete(getRecordListOptionValue(recordListId));
        }

        if (
          currentMemberships.length !== nextMemberships.size ||
          currentMemberships.some((value) => !nextMemberships.has(value))
        ) {
          await parentRepository.update(
            { id: sourceRecord.id },
            { [LIST_MEMBERSHIP_FIELD_NAME]: [...nextMemberships] },
          );
        }
      }
    }, buildSystemAuthContext(workspaceId));
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
    parentObjectMetadataId: string;
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
      parentObjectMetadataId: parentObjectMetadata.id,
    };
  }

  async createRecordListField({
    recordListId,
    fieldInput,
    workspaceId,
  }: {
    recordListId: string;
    fieldInput: Omit<CreateFieldInput, 'workspaceId' | 'objectMetadataId'>;
    workspaceId: string;
  }) {
    const recordList = await this.findOneOrThrow({
      id: recordListId,
      workspaceId,
    });

    const sanitizedInput: Omit<CreateFieldInput, 'workspaceId'> = {
      ...fieldInput,
      objectMetadataId: recordList.entryObjectMetadataId,
      type: fieldInput.type ?? FieldMetadataType.TEXT,
      isNullable: fieldInput.isNullable ?? true,
      isUnique: fieldInput.isUnique ?? false,
    };

    return this.fieldMetadataService.createOneField({
      createFieldInput: sanitizedInput,
      workspaceId,
    });
  }

  async updateRecordListField({
    recordListId,
    fieldId,
    fieldInput,
    workspaceId,
  }: {
    recordListId: string;
    fieldId: string;
    fieldInput: Omit<UpdateFieldInput, 'id' | 'workspaceId'>;
    workspaceId: string;
  }) {
    await this.assertEditableRecordListField({
      recordListId,
      fieldId,
      workspaceId,
    });

    return this.fieldMetadataService.updateOneField({
      updateFieldInput: { ...fieldInput, id: fieldId },
      workspaceId,
    });
  }

  private async getEditableRecordListEntryFields({
    entryObjectMetadataId,
    workspaceId,
  }: {
    entryObjectMetadataId: string;
    workspaceId: string;
  }) {
    const fields = await this.fieldMetadataService.findManyWithinWorkspace({
      workspaceId,
      objectMetadataId: entryObjectMetadataId,
      limit: 1000,
    });

    return fields.filter(
      (field) =>
        !field.isSystem &&
        field.name !== 'sourceRecord' &&
        RECORD_LIST_ENTRY_EDITOR_FIELD_TYPES.has(field.type),
    );
  }

  async deleteRecordListField({
    recordListId,
    fieldId,
    workspaceId,
  }: {
    recordListId: string;
    fieldId: string;
    workspaceId: string;
  }) {
    await this.assertEditableRecordListField({
      recordListId,
      fieldId,
      workspaceId,
    });

    return this.fieldMetadataService.deleteOneField({
      deleteOneFieldInput: { id: fieldId },
      workspaceId,
    });
  }

  private async findFieldMetadataWithinWorkspace({
    workspaceId,
    fieldMetadataId,
    objectMetadataId,
    name,
  }: {
    workspaceId: string;
    fieldMetadataId?: string;
    objectMetadataId?: string;
    name?: string;
  }) {
    const fieldMetadataItems =
      await this.fieldMetadataService.findManyWithinWorkspace({
        workspaceId,
        fieldMetadataId,
        objectMetadataId,
        limit: fieldMetadataId ? 1 : 100,
      });

    return (
      fieldMetadataItems.find(
        (fieldMetadataItem) =>
          !isDefined(name) || fieldMetadataItem.name === name,
      ) ?? null
    );
  }

  private async ensureRecordListEntryObjectMetadata({
    recordList,
    workspaceId,
  }: {
    recordList: RecordListEntity;
    workspaceId: string;
  }) {
    const entryObjectMetadata =
      await this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
        where: { id: recordList.entryObjectMetadataId },
      });

    if (entryObjectMetadata === null) {
      throw new RecordListException(
        'Record list entry object metadata not found in workspace',
        RecordListExceptionCode.INTERNAL_SERVER_ERROR,
      );
    }

    const expectedNames = buildRecordListEntryObjectNames(recordList.id);
    const update: {
      nameSingular?: string;
      namePlural?: string;
    } = {};

    if (
      entryObjectMetadata.nameSingular !== expectedNames.nameSingular ||
      entryObjectMetadata.namePlural !== expectedNames.namePlural
    ) {
      update.nameSingular = expectedNames.nameSingular;
      update.namePlural = expectedNames.namePlural;
    }

    if (Object.keys(update).length > 0) {
      await this.objectMetadataService.updateOneObject({
        updateObjectInput: {
          id: entryObjectMetadata.id,
          update,
        },
        workspaceId,
      });
    }

    const labelField = await this.findFieldMetadataWithinWorkspace({
      workspaceId,
      objectMetadataId: entryObjectMetadata.id,
      name: 'listEntryLabel',
    });
    if (!labelField) {
      const createdLabelField = await this.fieldMetadataService.createOneField({
        createFieldInput: {
          type: FieldMetadataType.TEXT,
          name: 'listEntryLabel',
          label: 'Record name',
          objectMetadataId: entryObjectMetadata.id,
          isNullable: true,
          isUnique: false,
          isSystem: true,
          isUIEditable: false,
        },
        workspaceId,
      });
      await this.objectMetadataService.updateOneObject({
        updateObjectInput: {
          id: entryObjectMetadata.id,
          update: { labelIdentifierFieldMetadataId: createdLabelField.id },
        },
        workspaceId,
      });
    } else if (
      entryObjectMetadata.labelIdentifierFieldMetadataId !== labelField.id
    ) {
      await this.objectMetadataService.updateOneObject({
        updateObjectInput: {
          id: entryObjectMetadata.id,
          update: { labelIdentifierFieldMetadataId: labelField.id },
        },
        workspaceId,
      });
    }
  }

  private async getSourceRecordLabel({
    sourceRecord,
    parentObjectMetadataId,
    workspaceId,
  }: {
    sourceRecord: Record<string, unknown> | undefined;
    parentObjectMetadataId: string;
    workspaceId: string;
  }): Promise<string> {
    if (!sourceRecord) return 'Unnamed record';
    const parentObjectMetadata =
      await this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
        where: { id: parentObjectMetadataId },
      });
    const identifierField = parentObjectMetadata?.labelIdentifierFieldMetadataId
      ? await this.findFieldMetadataWithinWorkspace({
          workspaceId,
          fieldMetadataId: parentObjectMetadata.labelIdentifierFieldMetadataId,
        })
      : null;
    const value = identifierField
      ? sourceRecord[identifierField.name]
      : undefined;
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'object' && value !== null) {
      const name = value as { firstName?: string; lastName?: string };
      const fullName = [name.firstName, name.lastName]
        .filter(Boolean)
        .join(' ');
      if (fullName) return fullName;
    }
    return 'Unnamed record';
  }

  private async ensureEntryDisplayNameField({
    recordList,
    workspaceId,
  }: {
    recordList: RecordListEntity;
    workspaceId: string;
  }) {
    const entryMetadata =
      await this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
        where: { id: recordList.entryObjectMetadataId },
      });
    const parentMetadata =
      await this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
        where: { id: recordList.parentObjectMetadataId },
      });
    if (!entryMetadata || !parentMetadata) return;
    const labelField = await this.findFieldMetadataWithinWorkspace({
      workspaceId,
      objectMetadataId: entryMetadata.id,
      name: 'listEntryLabel',
    });
    if (!labelField) return;
    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const entries = await this.workspaceOrmManager
        .getRepository<RecordListEntryRecord>(entryMetadata.nameSingular, {
          shouldBypassPermissionChecks: true,
        })
        .find({ order: { createdAt: 'ASC' } });
      const missingEntries = entries.filter((entry) => !entry.listEntryLabel);
      if (missingEntries.length === 0) return;
      const parentRepository = this.workspaceOrmManager.getRepository<
        Record<string, unknown> & { id: string }
      >(parentMetadata.nameSingular, { shouldBypassPermissionChecks: true });
      const sourceRecords = await parentRepository.findBy({
        id: In(missingEntries.map((entry) => entry.sourceRecordId)),
      });
      const sourceRecordById = new Map(
        sourceRecords.map((record) => [record.id, record]),
      );
      const entryRepository =
        this.workspaceOrmManager.getRepository<RecordListEntryRecord>(
          entryMetadata.nameSingular,
          { shouldBypassPermissionChecks: true },
        );
      for (const entry of missingEntries) {
        await entryRepository.update(
          { id: entry.id },
          {
            listEntryLabel: await this.getSourceRecordLabel({
              sourceRecord: sourceRecordById.get(entry.sourceRecordId),
              parentObjectMetadataId: parentMetadata.id,
              workspaceId,
            }),
          },
        );
      }
    }, buildSystemAuthContext(workspaceId));
  }

  private async ensureKanbanCardFields({
    recordList,
    workspaceId,
  }: {
    recordList: RecordListEntity;
    workspaceId: string;
  }) {
    const fields = await this.fieldMetadataService.findManyWithinWorkspace({
      workspaceId,
      objectMetadataId: recordList.entryObjectMetadataId,
      limit: 100,
    });
    const cardFields = fields
      .filter(
        (fieldMetadata) =>
          !fieldMetadata.isSystem &&
          !RECORD_LIST_RELATION_FIELD_NAMES.has(fieldMetadata.name) &&
          fieldMetadata.name !== 'notes',
      )
      .sort(
        (leftField, rightField) =>
          leftField.createdAt.getTime() - rightField.createdAt.getTime(),
      )
      .slice(0, 4);

    if (cardFields.length === 0) return;

    const kanbanViews = await this.viewRepository.find(workspaceId, {
      where: {
        objectMetadataId: recordList.entryObjectMetadataId,
        type: ViewType.KANBAN,
      },
      relations: ['viewFields'],
    });

    const fieldsById = new Map(
      fields.map((fieldMetadata) => [fieldMetadata.id, fieldMetadata]),
    );

    for (const view of kanbanViews) {
      const viewFieldsByMetadataId = new Map(
        view.viewFields.map((viewField) => [
          viewField.fieldMetadataId,
          viewField,
        ]),
      );

      for (const viewField of view.viewFields) {
        const fieldName = fieldsById.get(viewField.fieldMetadataId)?.name;

        if (
          fieldName &&
          [
            'attachments',
            'noteTargets',
            'taskTargets',
            'timelineActivities',
          ].includes(fieldName) &&
          viewField.isVisible
        ) {
          await this.viewFieldService.updateOne({
            updateViewFieldInput: {
              id: viewField.id,
              update: { isVisible: false },
            },
            workspaceId,
          });
        }
      }

      for (const [position, fieldMetadata] of cardFields.entries()) {
        const existingViewField = viewFieldsByMetadataId.get(fieldMetadata.id);

        if (existingViewField) {
          if (
            !existingViewField.isVisible ||
            existingViewField.position !== position
          ) {
            await this.viewFieldService.updateOne({
              updateViewFieldInput: {
                id: existingViewField.id,
                update: { isVisible: true, position },
              },
              workspaceId,
            });
          }

          continue;
        }

        await this.viewFieldService.createOne({
          createViewFieldInput: {
            viewId: view.id,
            fieldMetadataId: fieldMetadata.id,
            isVisible: true,
            position,
          },
          workspaceId,
        });
      }
    }
  }

  private async configureDefaultListView({
    entryObjectMetadataId,
    sourceRecordFieldMetadataId,
    listFieldMetadataIds,
    workspaceId,
  }: {
    entryObjectMetadataId: string;
    sourceRecordFieldMetadataId: string;
    listFieldMetadataIds: string[];
    workspaceId: string;
  }) {
    const indexView = await this.viewRepository.findOne(workspaceId, {
      where: {
        objectMetadataId: entryObjectMetadataId,
        key: ViewKey.INDEX,
      },
      relations: ['viewFields'],
    });

    if (indexView === null) {
      return;
    }

    for (const viewField of indexView.viewFields) {
      const isSourceRecord =
        viewField.fieldMetadataId === sourceRecordFieldMetadataId;
      const listFieldPosition = listFieldMetadataIds.indexOf(
        viewField.fieldMetadataId,
      );
      const isListField = listFieldPosition !== -1;

      await this.viewFieldService.updateOne({
        updateViewFieldInput: {
          id: viewField.id,
          update: {
            isVisible: isSourceRecord || isListField,
            ...(isSourceRecord ? { position: 0 } : {}),
            ...(isListField ? { position: listFieldPosition + 1 } : {}),
          },
        },
        workspaceId,
      });
    }
  }

  private async assertEditableRecordListField({
    recordListId,
    fieldId,
    workspaceId,
  }: {
    recordListId: string;
    fieldId: string;
    workspaceId: string;
  }) {
    const recordList = await this.findOneOrThrow({
      id: recordListId,
      workspaceId,
    });
    const fieldMetadata = await this.findFieldMetadataWithinWorkspace({
      workspaceId,
      fieldMetadataId: fieldId,
    });

    if (
      !fieldMetadata ||
      fieldMetadata.objectMetadataId !== recordList.entryObjectMetadataId
    ) {
      throw new RecordListException(
        'Field metadata does not belong to the record list entry object',
        RecordListExceptionCode.RECORD_LIST_FIELD_NOT_FOUND,
      );
    }

    if (fieldMetadata.isSystem || fieldMetadata.name === 'sourceRecord') {
      throw new RecordListException(
        'System-owned record list fields cannot be changed',
        RecordListExceptionCode.SYSTEM_FIELD_NOT_EDITABLE,
      );
    }

    return fieldMetadata;
  }

  private getRecordListEntryValues(entry: RecordListEntryRecord) {
    const excludedFieldNames = new Set([
      'id',
      'sourceRecordId',
      'position',
      'createdBy',
      'updatedBy',
      'createdAt',
      'updatedAt',
      'deletedAt',
    ]);

    return Object.fromEntries(
      Object.entries(entry).filter(
        ([fieldName]) => !excludedFieldNames.has(fieldName),
      ),
    );
  }

  private async getEntryActorFields({
    entryObjectMetadataNameSingular,
    workspaceId,
  }: {
    entryObjectMetadataNameSingular: string;
    workspaceId: string;
  }): Promise<Pick<RecordListEntryRecord, 'createdBy' | 'updatedBy'>> {
    let authContext: WorkspaceAuthContext;

    try {
      authContext = getWorkspaceAuthContext();
    } catch {
      return {
        createdBy: SYSTEM_ACTOR,
        updatedBy: SYSTEM_ACTOR,
      };
    }

    if (authContext.type === 'system') {
      return {
        createdBy: SYSTEM_ACTOR,
        updatedBy: SYSTEM_ACTOR,
      };
    }

    const [recordWithActorFields] =
      await this.actorFromAuthContextService.injectActorFieldsOnCreate({
        records: [{}],
        objectMetadataNameSingular: entryObjectMetadataNameSingular,
        authContext: {
          ...authContext,
          workspace: {
            ...authContext.workspace,
            id: workspaceId,
          },
        },
      });

    return {
      createdBy: recordWithActorFields.createdBy as ActorMetadata,
      updatedBy: recordWithActorFields.updatedBy as ActorMetadata,
    };
  }

  private async synchronizeRecordListLabels({
    recordList,
    name,
    workspaceId,
  }: {
    recordList: RecordListEntity;
    name: string;
    workspaceId: string;
  }) {
    await this.objectMetadataService.updateOneObject({
      updateObjectInput: {
        id: recordList.entryObjectMetadataId,
        update: {
          labelSingular: `${name} entry`,
          labelPlural: `${name} entries`,
        },
      },
      workspaceId,
    });

    const entryFields = await this.fieldMetadataService.findManyWithinWorkspace(
      {
        workspaceId,
        objectMetadataId: recordList.entryObjectMetadataId,
        limit: 100,
      },
    );
    const sourceRecordField = entryFields.find(
      (fieldMetadata) => fieldMetadata.name === 'sourceRecord',
    );

    if (!sourceRecordField?.relationTargetFieldMetadataId) {
      return;
    }

    await this.fieldMetadataService.updateOneField({
      updateFieldInput: {
        id: sourceRecordField.relationTargetFieldMetadataId,
        label: `${name} entries`,
      },
      workspaceId,
    });
  }

  private async createTemplateKanbanView({
    entryObjectMetadataId,
    statusFieldMetadataId,
    workspaceId,
    createdByUserWorkspaceId,
  }: {
    entryObjectMetadataId: string;
    statusFieldMetadataId: string | null;
    workspaceId: string;
    createdByUserWorkspaceId: string | null;
  }) {
    if (statusFieldMetadataId === null) {
      return null;
    }

    const view = await this.viewService.createOne({
      createViewInput: {
        name: 'Pipeline',
        objectMetadataId: entryObjectMetadataId,
        type: ViewType.KANBAN,
        icon: 'IconLayoutKanban',
        position: 1,
        mainGroupByFieldMetadataId: statusFieldMetadataId,
        shouldHideEmptyGroups: false,
        visibility: ViewVisibility.WORKSPACE,
      },
      workspaceId,
      createdByUserWorkspaceId: createdByUserWorkspaceId ?? undefined,
    });

    return view.id;
  }
}
