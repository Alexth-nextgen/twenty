import { FieldMetadataType, RelationType } from 'twenty-shared/types';

import { type CreateFieldInput } from 'src/engine/metadata-modules/field-metadata/dtos/create-field.input';
import { type CreateObjectInput } from 'src/engine/metadata-modules/object-metadata/dtos/create-object.input';

const RECORD_LIST_ENTRY_OBJECT_NAME_PREFIX = 'recordListEntry';

export const buildRecordListEntryObjectInput = ({
  recordListId,
  recordListName,
}: {
  recordListId: string;
  recordListName: string;
}): CreateObjectInput => {
  const normalizedRecordListId = recordListId.replace(/-/g, '');
  const nameSingular = `${RECORD_LIST_ENTRY_OBJECT_NAME_PREFIX}${normalizedRecordListId}`;

  return {
    nameSingular,
    namePlural: `${nameSingular}Collection`,
    labelSingular: `${recordListName} entry`,
    labelPlural: `${recordListName} entries`,
    icon: 'IconAddressBook',
    skipNameField: true,
    isLabelSyncedWithName: false,
  };
};

export const buildRecordListSourceRecordFieldInput = ({
  entryObjectMetadataId,
  parentObjectMetadataId,
  parentObjectLabelSingular,
  recordListName,
}: {
  entryObjectMetadataId: string;
  parentObjectMetadataId: string;
  parentObjectLabelSingular: string;
  recordListName: string;
}): Omit<CreateFieldInput, 'workspaceId'> => ({
  type: FieldMetadataType.RELATION,
  name: 'sourceRecord',
  label: parentObjectLabelSingular,
  icon: 'IconAddressBook',
  objectMetadataId: entryObjectMetadataId,
  isNullable: false,
  isUnique: false,
  relationCreationPayload: {
    type: RelationType.MANY_TO_ONE,
    targetObjectMetadataId: parentObjectMetadataId,
    targetFieldLabel: `${recordListName} entries`,
    targetFieldIcon: 'IconList',
  },
});
