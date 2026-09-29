import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  RECORD_LIST_ENTRIES_FIELD_UNIVERSAL_IDENTIFIER,
  RECORD_LIST_ENTRY_LIST_FIELD_UNIVERSAL_IDENTIFIER,
  RECORD_LIST_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  RECORD_LIST_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: RECORD_LIST_ENTRIES_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: RECORD_LIST_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'entries',
  label: 'Entries',
  description: 'People or companies contained in this list.',
  icon: 'IconListDetails',
  relationTargetObjectMetadataUniversalIdentifier:
    RECORD_LIST_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    RECORD_LIST_ENTRY_LIST_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
