import {
  defineObject,
  FieldType,
  MetadataWritability,
  ObjectOpenRecordIn,
} from 'twenty-sdk/define';

import {
  RECORD_LIST_ENTRY_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  RECORD_LIST_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  RECORD_LIST_ENTRY_POSITION_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: RECORD_LIST_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'recordListEntry',
  namePlural: 'recordListEntries',
  labelSingular: 'List entry',
  labelPlural: 'List entries',
  description: 'A person or company membership in a list.',
  icon: 'IconListDetails',
  isSearchable: false,
  isUICreatable: false,
  isUIEditable: true,
  writability: MetadataWritability.APPLICATION,
  openRecordIn: ObjectOpenRecordIn.SIDE_PANEL,
  labelIdentifierFieldMetadataUniversalIdentifier:
    RECORD_LIST_ENTRY_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: RECORD_LIST_ENTRY_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      description: 'Stable label for the source record membership.',
      icon: 'IconAbc',
      isNullable: false,
      defaultValue: "'List entry'",
    },
    {
      universalIdentifier:
        RECORD_LIST_ENTRY_POSITION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'sortOrder',
      label: 'Sort order',
      description: 'Ordering value inside the list.',
      icon: 'IconArrowsSort',
    },
  ],
});
