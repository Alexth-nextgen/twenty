import { FieldMetadataService } from 'src/engine/core-modules/application/native-extension-host/api/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { ObjectMetadataService } from 'src/engine/core-modules/application/native-extension-host/api/engine/metadata-modules/object-metadata/object-metadata.service';
import { RecordListEntity } from '../../entities/record-list.entity';
import { RecordListExceptionCode } from '../../record-list.exception';
import { RecordListService } from '../record-list.service';
import { WorkspaceOrmManager } from 'src/engine/core-modules/application/native-extension-host/api/engine/twenty-orm/workspace-orm.manager';
import { WorkspaceScopedRepository } from 'src/engine/core-modules/application/native-extension-host/api/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { ViewEntity } from 'src/engine/core-modules/application/native-extension-host/api/engine/metadata-modules/view/entities/view.entity';

const WORKSPACE_ID = 'a1a2a3a4-a5a6-4000-8000-000000000001';
const PARENT_OBJECT_METADATA_ID = 'b1b2b3b4-b5b6-4000-8000-000000000001';
const ENTRY_OBJECT_METADATA_ID = 'c1c2c3c4-c5c6-4000-8000-000000000001';
const RECORD_LIST_ID = 'd1d2d3d4-d5d6-4000-8000-000000000001';
const SOURCE_RECORD_ID = 'e1e2e3e4-e5e6-4000-8000-000000000001';
const SECOND_SOURCE_RECORD_ID = 'e1e2e3e4-e5e6-4000-8000-000000000002';
const ENTRY_ID = 'f1f2f3f4-f5f6-4000-8000-000000000001';

describe('RecordListService', () => {
  const insertAndReturnOne = jest.fn();
  const find = jest.fn();
  const findOneBy = jest.fn();
  const maximum = jest.fn();
  const update = jest.fn();
  const findOneWithinWorkspace = jest.fn();
  const createOneObject = jest.fn();
  const deleteOneObject = jest.fn();
  const createOneField = jest.fn();
  const findManyFieldsWithinWorkspace = jest.fn();
  const findOneFieldWithinWorkspace = jest.fn();
  const updateOneField = jest.fn();
  const deleteOneField = jest.fn();
  const getRepository = jest.fn();
  const sourceRecordExistsBy = jest.fn();
  const sourceRecordFindBy = jest.fn();
  const entryFind = jest.fn();
  const entryFindOneBy = jest.fn();
  const entryMaximum = jest.fn();
  const entryInsert = jest.fn();
  const entryDelete = jest.fn();
  const viewFindOneBy = jest.fn();
  const parentWorkspaceRepository = {
    existsBy: sourceRecordExistsBy,
    findBy: sourceRecordFindBy,
  };
  const entryWorkspaceRepository = {
    find: entryFind,
    findOneBy: entryFindOneBy,
    maximum: entryMaximum,
    insert: entryInsert,
    delete: entryDelete,
  };

  const service = new RecordListService(
    {
      insertAndReturnOne,
      find,
      findOneBy,
      maximum,
      update,
    } as unknown as WorkspaceScopedRepository<RecordListEntity>,
    {
      findOneWithinWorkspace,
      createOneObject,
      deleteOneObject,
    } as unknown as ObjectMetadataService,
    {
      createOneField,
      findManyWithinWorkspace: findManyFieldsWithinWorkspace,
      findOneWithinWorkspace: findOneFieldWithinWorkspace,
      updateOneField,
      deleteOneField,
    } as unknown as FieldMetadataService,
    { getRepository } as unknown as WorkspaceOrmManager,
    {
      findOneBy: viewFindOneBy,
    } as unknown as WorkspaceScopedRepository<ViewEntity>,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    findOneWithinWorkspace.mockImplementation((_workspaceId, options) =>
      options.where.id === ENTRY_OBJECT_METADATA_ID
        ? {
            id: ENTRY_OBJECT_METADATA_ID,
            nameSingular: 'recordListEntry',
          }
        : {
            id: PARENT_OBJECT_METADATA_ID,
            labelSingular: 'Person',
            nameSingular: 'person',
          },
    );
    createOneObject.mockResolvedValue({ id: ENTRY_OBJECT_METADATA_ID });
    createOneField.mockResolvedValue({ id: 'source-record-field-id' });
    findManyFieldsWithinWorkspace.mockResolvedValue([]);
    insertAndReturnOne.mockImplementation((workspaceId, recordList) => ({
      ...recordList,
      workspaceId,
    }));
    maximum.mockResolvedValue(null);
    deleteOneObject.mockResolvedValue({ id: ENTRY_OBJECT_METADATA_ID });
    getRepository.mockImplementation((objectName) =>
      objectName === 'person'
        ? parentWorkspaceRepository
        : entryWorkspaceRepository,
    );
    sourceRecordExistsBy.mockResolvedValue(true);
    sourceRecordFindBy.mockResolvedValue([{ id: SOURCE_RECORD_ID }]);
    entryFindOneBy.mockResolvedValue(null);
    entryMaximum.mockResolvedValue(null);
    entryInsert.mockResolvedValue({
      raw: [
        {
          id: ENTRY_ID,
          sourceRecordId: SOURCE_RECORD_ID,
          position: 0,
        },
      ],
    });
    findOneFieldWithinWorkspace.mockResolvedValue({
      id: 'list-field-id',
      name: 'status',
      objectMetadataId: ENTRY_OBJECT_METADATA_ID,
      isSystem: false,
    });
    viewFindOneBy.mockResolvedValue({ id: 'view-id' });
  });

  it('creates a navigation-hidden entry object and its source relation', async () => {
    const recordList = await service.createRecordList({
      name: 'Recruiting',
      parentObjectMetadataId: PARENT_OBJECT_METADATA_ID,
      workspaceId: WORKSPACE_ID,
    });

    const createObjectArgs = createOneObject.mock.calls[0][0];

    expect(createObjectArgs).toEqual(
      expect.objectContaining({
        workspaceId: WORKSPACE_ID,
        shouldCreateObjectNavigationItems: false,
        recordListId: expect.any(String),
      }),
    );
    expect(createObjectArgs.createObjectInput.nameSingular.toLowerCase()).toContain(
      createObjectArgs.recordListId.replace(/-/g, ''),
    );
    expect(createOneField).toHaveBeenCalledWith({
      workspaceId: WORKSPACE_ID,
      createFieldInput: expect.objectContaining({
        name: 'sourceRecord',
        objectMetadataId: ENTRY_OBJECT_METADATA_ID,
        isNullable: true,
        isUnique: false,
        relationCreationPayload: expect.objectContaining({
          targetObjectMetadataId: PARENT_OBJECT_METADATA_ID,
        }),
      }),
    });
    expect(recordList).toEqual(
      expect.objectContaining({
        id: createObjectArgs.recordListId,
        name: 'Recruiting',
        workspaceId: WORKSPACE_ID,
        parentObjectMetadataId: PARENT_OBJECT_METADATA_ID,
        entryObjectMetadataId: ENTRY_OBJECT_METADATA_ID,
      }),
    );
    expect(insertAndReturnOne).toHaveBeenCalledWith(
      WORKSPACE_ID,
      expect.not.objectContaining({ workspaceId: expect.anything() }),
    );
  });

  it('rejects a parent object from outside the workspace', async () => {
    findOneWithinWorkspace.mockResolvedValue(null);

    await expect(
      service.createRecordList({
        name: 'Recruiting',
        parentObjectMetadataId: PARENT_OBJECT_METADATA_ID,
        workspaceId: WORKSPACE_ID,
      }),
    ).rejects.toMatchObject({
      code: RecordListExceptionCode.PARENT_OBJECT_NOT_FOUND,
    });

    expect(createOneObject).not.toHaveBeenCalled();
  });

  it('shows only the source record and list status in the default view', async () => {
    createOneField
      .mockResolvedValueOnce({ id: 'source-record-field-id' })
      .mockResolvedValueOnce({ id: 'status-field-id' });
    viewFindOne.mockResolvedValue({
      viewFields: [
        { id: 'system-view-field-id', fieldMetadataId: 'system-field-id' },
        {
          id: 'source-view-field-id',
          fieldMetadataId: 'source-record-field-id',
        },
        { id: 'status-view-field-id', fieldMetadataId: 'status-field-id' },
      ],
    });

    await service.createRecordList({
      name: 'Recruiting',
      parentObjectMetadataId: PARENT_OBJECT_METADATA_ID,
      workspaceId: WORKSPACE_ID,
    });

    expect(viewFindOne).toHaveBeenCalledWith(WORKSPACE_ID, {
      where: {
        objectMetadataId: ENTRY_OBJECT_METADATA_ID,
        key: 'INDEX',
      },
      relations: ['viewFields'],
    });
    expect(updateOneViewField).toHaveBeenCalledTimes(3);
    expect(updateOneViewField).toHaveBeenCalledWith({
      workspaceId: WORKSPACE_ID,
      updateViewFieldInput: {
        id: 'system-view-field-id',
        update: { isVisible: false },
      },
    });
    expect(updateOneViewField).toHaveBeenCalledWith({
      workspaceId: WORKSPACE_ID,
      updateViewFieldInput: {
        id: 'source-view-field-id',
        update: { isVisible: true, position: 0 },
      },
    });
    expect(updateOneViewField).toHaveBeenCalledWith({
      workspaceId: WORKSPACE_ID,
      updateViewFieldInput: {
        id: 'status-view-field-id',
        update: { isVisible: true, position: 1 },
      },
    });
  });

  it('removes the entry object when provisioning fails', async () => {
    const provisioningError = new Error('field creation failed');

    createOneField.mockRejectedValue(provisioningError);

    await expect(
      service.createRecordList({
        name: 'Recruiting',
        parentObjectMetadataId: PARENT_OBJECT_METADATA_ID,
        workspaceId: WORKSPACE_ID,
      }),
    ).rejects.toBe(provisioningError);

    expect(deleteOneObject).toHaveBeenCalledWith({
      deleteObjectInput: { id: ENTRY_OBJECT_METADATA_ID },
      workspaceId: WORKSPACE_ID,
    });
    expect(insertAndReturnOne).not.toHaveBeenCalled();
  });

  it('returns lists in their sidebar order', async () => {
    find.mockResolvedValue([{ id: 'record-list-id' }]);

    await expect(
      service.findAll({ workspaceId: WORKSPACE_ID }),
    ).resolves.toEqual([{ id: 'record-list-id' }]);
    expect(find).toHaveBeenCalledWith(WORKSPACE_ID, {
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  });

  it('updates only the requested list properties within the workspace', async () => {
    findOneBy
      .mockResolvedValueOnce({
        id: 'record-list-id',
        name: 'Recruiting',
        entryObjectMetadataId: ENTRY_OBJECT_METADATA_ID,
      })
      .mockResolvedValueOnce({
        id: 'record-list-id',
        name: 'Hiring',
        entryObjectMetadataId: ENTRY_OBJECT_METADATA_ID,
      });

    await expect(
      service.updateRecordList({
        id: 'record-list-id',
        name: 'Hiring',
        workspaceId: WORKSPACE_ID,
      }),
    ).resolves.toEqual({
      id: 'record-list-id',
      name: 'Hiring',
      entryObjectMetadataId: ENTRY_OBJECT_METADATA_ID,
    });
    expect(update).toHaveBeenCalledWith(
      WORKSPACE_ID,
      { id: 'record-list-id' },
      { name: 'Hiring' },
    );
  });

  it('deletes the internal entry object when deleting a list', async () => {
    const recordList = {
      id: 'record-list-id',
      entryObjectMetadataId: ENTRY_OBJECT_METADATA_ID,
    };

    findOneBy.mockResolvedValue(recordList);

    await expect(
      service.deleteRecordList({
        id: 'record-list-id',
        workspaceId: WORKSPACE_ID,
      }),
    ).resolves.toBe(recordList);
    expect(deleteOneObject).toHaveBeenCalledWith({
      deleteObjectInput: { id: ENTRY_OBJECT_METADATA_ID },
      workspaceId: WORKSPACE_ID,
    });
  });

  it('adds a source record to a list', async () => {
    findOneBy.mockResolvedValue({
      id: RECORD_LIST_ID,
      parentObjectMetadataId: PARENT_OBJECT_METADATA_ID,
      entryObjectMetadataId: ENTRY_OBJECT_METADATA_ID,
    });

    await expect(
      service.addRecordToList({
        recordListId: RECORD_LIST_ID,
        sourceRecordId: SOURCE_RECORD_ID,
        workspaceId: WORKSPACE_ID,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: ENTRY_ID,
        sourceRecordId: SOURCE_RECORD_ID,
      }),
    );
    expect(sourceRecordExistsBy).toHaveBeenCalledWith({
      id: SOURCE_RECORD_ID,
    });
    expect(entryInsert).toHaveBeenCalledWith({
      sourceRecordId: SOURCE_RECORD_ID,
      position: 0,
    });
  });

  it('returns the existing entry instead of adding a duplicate', async () => {
    const existingEntry = {
      id: ENTRY_ID,
      sourceRecordId: SOURCE_RECORD_ID,
    };

    findOneBy.mockResolvedValue({
      id: RECORD_LIST_ID,
      parentObjectMetadataId: PARENT_OBJECT_METADATA_ID,
      entryObjectMetadataId: ENTRY_OBJECT_METADATA_ID,
    });
    entryFindOneBy.mockResolvedValue(existingEntry);

    await expect(
      service.addRecordToList({
        recordListId: RECORD_LIST_ID,
        sourceRecordId: SOURCE_RECORD_ID,
        workspaceId: WORKSPACE_ID,
      }),
    ).resolves.toBe(existingEntry);
    expect(entryInsert).not.toHaveBeenCalled();
  });

  it('adds multiple records in one insert and skips existing entries', async () => {
    findOneBy.mockResolvedValue({
      id: RECORD_LIST_ID,
      parentObjectMetadataId: PARENT_OBJECT_METADATA_ID,
      entryObjectMetadataId: ENTRY_OBJECT_METADATA_ID,
    });
    sourceRecordFindBy.mockResolvedValue([
      { id: SOURCE_RECORD_ID },
      { id: SECOND_SOURCE_RECORD_ID },
    ]);
    entryFind.mockResolvedValue([
      { id: ENTRY_ID, sourceRecordId: SOURCE_RECORD_ID },
    ]);
    entryMaximum.mockResolvedValue(4);

    await expect(
      service.addRecordsToList({
        recordListId: RECORD_LIST_ID,
        sourceRecordIds: [SOURCE_RECORD_ID, SECOND_SOURCE_RECORD_ID],
        workspaceId: WORKSPACE_ID,
      }),
    ).resolves.toEqual({ addedCount: 1, skippedCount: 1 });
    expect(entryInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        sourceRecordId: SECOND_SOURCE_RECORD_ID,
        position: 5,
      }),
    ]);
  });

  it('rejects a source record that does not exist in the list object', async () => {
    findOneBy.mockResolvedValue({
      id: RECORD_LIST_ID,
      parentObjectMetadataId: PARENT_OBJECT_METADATA_ID,
      entryObjectMetadataId: ENTRY_OBJECT_METADATA_ID,
    });
    sourceRecordExistsBy.mockResolvedValue(false);

    await expect(
      service.addRecordToList({
        recordListId: RECORD_LIST_ID,
        sourceRecordId: SOURCE_RECORD_ID,
        workspaceId: WORKSPACE_ID,
      }),
    ).rejects.toMatchObject({
      code: RecordListExceptionCode.SOURCE_RECORD_NOT_FOUND,
    });
    expect(entryInsert).not.toHaveBeenCalled();
  });

  it('lists entries in their list order', async () => {
    findOneBy.mockResolvedValue({
      id: RECORD_LIST_ID,
      parentObjectMetadataId: PARENT_OBJECT_METADATA_ID,
      entryObjectMetadataId: ENTRY_OBJECT_METADATA_ID,
    });
    entryFind.mockResolvedValue([{ id: ENTRY_ID }]);

    await expect(
      service.findRecordListEntries({
        recordListId: RECORD_LIST_ID,
        workspaceId: WORKSPACE_ID,
      }),
    ).resolves.toEqual([{ id: ENTRY_ID }]);
    expect(entryFind).toHaveBeenCalledWith({
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  });

  it('removes only the selected list entry', async () => {
    const entry = { id: ENTRY_ID, sourceRecordId: SOURCE_RECORD_ID };

    findOneBy.mockResolvedValue({
      id: RECORD_LIST_ID,
      parentObjectMetadataId: PARENT_OBJECT_METADATA_ID,
      entryObjectMetadataId: ENTRY_OBJECT_METADATA_ID,
    });
    entryFindOneBy.mockResolvedValue(entry);

    await expect(
      service.removeRecordFromList({
        recordListId: RECORD_LIST_ID,
        entryId: ENTRY_ID,
        workspaceId: WORKSPACE_ID,
      }),
    ).resolves.toBe(entry);
    expect(entryDelete).toHaveBeenCalledWith(ENTRY_ID);
  });

  it('rejects updating a field owned by another object', async () => {
    findOneBy.mockResolvedValue({
      id: RECORD_LIST_ID,
      entryObjectMetadataId: ENTRY_OBJECT_METADATA_ID,
    });
    findOneFieldWithinWorkspace.mockResolvedValue({
      id: 'other-field-id',
      name: 'notes',
      objectMetadataId: 'other-object-id',
      isSystem: false,
    });

    await expect(
      service.updateRecordListField({
        recordListId: RECORD_LIST_ID,
        fieldId: 'other-field-id',
        fieldInput: { label: 'Notes' },
        workspaceId: WORKSPACE_ID,
      }),
    ).rejects.toMatchObject({
      code: RecordListExceptionCode.RECORD_LIST_FIELD_NOT_FOUND,
    });
    expect(updateOneField).not.toHaveBeenCalled();
  });

  it('rejects deleting the source record relation', async () => {
    findOneBy.mockResolvedValue({
      id: RECORD_LIST_ID,
      entryObjectMetadataId: ENTRY_OBJECT_METADATA_ID,
    });
    findOneFieldWithinWorkspace.mockResolvedValue({
      id: 'source-field-id',
      name: 'sourceRecord',
      objectMetadataId: ENTRY_OBJECT_METADATA_ID,
      isSystem: false,
    });

    await expect(
      service.deleteRecordListField({
        recordListId: RECORD_LIST_ID,
        fieldId: 'source-field-id',
        workspaceId: WORKSPACE_ID,
      }),
    ).rejects.toMatchObject({
      code: RecordListExceptionCode.SYSTEM_FIELD_NOT_EDITABLE,
    });
    expect(deleteOneField).not.toHaveBeenCalled();
  });

  it('rejects a default view owned by another object', async () => {
    findOneBy.mockResolvedValue({
      id: RECORD_LIST_ID,
      entryObjectMetadataId: ENTRY_OBJECT_METADATA_ID,
    });
    viewFindOneBy.mockResolvedValue(null);

    await expect(
      service.updateRecordList({
        id: RECORD_LIST_ID,
        defaultViewId: '11111111-1111-4111-8111-111111111111',
        workspaceId: WORKSPACE_ID,
      }),
    ).rejects.toMatchObject({
      code: RecordListExceptionCode.DEFAULT_VIEW_NOT_FOUND,
    });
    expect(update).not.toHaveBeenCalled();
  });
});
