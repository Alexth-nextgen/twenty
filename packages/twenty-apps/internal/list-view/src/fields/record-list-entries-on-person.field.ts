import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  PERSON_RECORD_LIST_ENTRIES_FIELD_UNIVERSAL_IDENTIFIER,
  RECORD_LIST_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  RECORD_LIST_ENTRY_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: PERSON_RECORD_LIST_ENTRIES_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.RELATION,
  name: 'recordListEntries',
  label: 'Lists',
  description: 'Lists containing this person.',
  icon: 'IconList',
  relationTargetObjectMetadataUniversalIdentifier:
    RECORD_LIST_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    RECORD_LIST_ENTRY_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
