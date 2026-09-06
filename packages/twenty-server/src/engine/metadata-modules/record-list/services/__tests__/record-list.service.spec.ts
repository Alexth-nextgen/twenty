import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { RecordListEntity } from 'src/engine/metadata-modules/record-list/entities/record-list.entity';
import { RecordListExceptionCode } from 'src/engine/metadata-modules/record-list/record-list.exception';
import { RecordListService } from 'src/engine/metadata-modules/record-list/services/record-list.service';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';

const WORKSPACE_ID = 'a1a2a3a4-a5a6-4000-8000-000000000001';
const PARENT_OBJECT_METADATA_ID = 'b1b2b3b4-b5b6-4000-8000-000000000001';
const ENTRY_OBJECT_METADATA_ID = 'c1c2c3c4-c5c6-4000-8000-000000000001';
const RECORD_LIST_ID = 'd1d2d3d4-d5d6-4000-8000-000000000001';
const SOURCE_RECORD_ID = 'e1e2e3e4-e5e6-4000-8000-000000000001';
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
  const getRepository = jest.fn();
  const sourceRecordExistsBy = jest.fn();
  const entryFind = jest.fn();
  const entryFindOneBy = jest.fn();
  const entryMaximum = jest.fn();
  const entryInsert = jest.fn();
  const entryDelete = jest.fn();
  const parentWorkspaceRepository = { existsBy: sourceRecordExistsBy };
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
    { createOneField } as unknown as FieldMetadataService,
    { getRepository } as unknown as WorkspaceOrmManager,
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
    expect(createObjectArgs.createObjectInput.nameSingular).toContain(
      createObjectArgs.recordListId.replace(/-/g, ''),
    );
    expect(createOneField).toHaveBeenCalledWith({
      workspaceId: WORKSPACE_ID,
      createFieldInput: expect.objectContaining({
        name: 'sourceRecord',
        objectMetadataId: ENTRY_OBJECT_METADATA_ID,
        isNullable: false,
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
      .mockResolvedValueOnce({ id: 'record-list-id', name: 'Recruiting' })
      .mockResolvedValueOnce({ id: 'record-list-id', name: 'Hiring' });

    await expect(
      service.updateRecordList({
        id: 'record-list-id',
        name: 'Hiring',
        workspaceId: WORKSPACE_ID,
      }),
    ).resolves.toEqual({ id: 'record-list-id', name: 'Hiring' });
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

  it('adds the same source record as an independent list entry', async () => {
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
});
