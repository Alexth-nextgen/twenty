import { defineObject, FieldType, ObjectOpenRecordIn } from 'twenty-sdk/define';

import {
  RECORD_LIST_ICON_FIELD_UNIVERSAL_IDENTIFIER,
  RECORD_LIST_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  RECORD_LIST_OBJECT_UNIVERSAL_IDENTIFIER,
  RECORD_LIST_POSITION_FIELD_UNIVERSAL_IDENTIFIER,
  RECORD_LIST_TARGET_COMPANIES,
  RECORD_LIST_TARGET_COMPANIES_OPTION_UNIVERSAL_IDENTIFIER,
  RECORD_LIST_TARGET_FIELD_UNIVERSAL_IDENTIFIER,
  RECORD_LIST_TARGET_PEOPLE,
  RECORD_LIST_TARGET_PEOPLE_OPTION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: RECORD_LIST_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'recordList',
  namePlural: 'recordLists',
  labelSingular: 'List',
  labelPlural: 'Lists',
  description: 'A reusable collection of people or companies.',
  icon: 'IconList',
  isSearchable: true,
  openRecordIn: ObjectOpenRecordIn.RECORD_PAGE,
  labelIdentifierFieldMetadataUniversalIdentifier:
    RECORD_LIST_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: RECORD_LIST_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      description: 'List name.',
      icon: 'IconAbc',
      isNullable: false,
      defaultValue: "'Untitled list'",
    },
    {
      universalIdentifier: RECORD_LIST_TARGET_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'target',
      label: 'Record type',
      description: 'The kind of CRM records accepted by this list.',
      icon: 'IconTarget',
      isNullable: false,
      defaultValue: `'${RECORD_LIST_TARGET_PEOPLE}'`,
      options: [
        {
          id: RECORD_LIST_TARGET_PEOPLE_OPTION_UNIVERSAL_IDENTIFIER,
          value: RECORD_LIST_TARGET_PEOPLE,
          label: 'People',
          color: 'blue',
          position: 0,
        },
        {
          id: RECORD_LIST_TARGET_COMPANIES_OPTION_UNIVERSAL_IDENTIFIER,
          value: RECORD_LIST_TARGET_COMPANIES,
          label: 'Companies',
          color: 'green',
          position: 1,
        },
      ],
    },
    {
      universalIdentifier: RECORD_LIST_ICON_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'icon',
      label: 'Icon',
      description: 'Optional Twenty icon name for this list.',
      icon: 'IconIcons',
      defaultValue: "'IconList'",
    },
    {
      universalIdentifier: RECORD_LIST_POSITION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'sortOrder',
      label: 'Sort order',
      description: 'Ordering value of the list.',
      icon: 'IconArrowsSort',
    },
  ],
});
