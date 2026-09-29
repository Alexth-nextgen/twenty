import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  COMPANY_RECORD_LIST_ENTRIES_FIELD_UNIVERSAL_IDENTIFIER,
  RECORD_LIST_ENTRY_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
  RECORD_LIST_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: RECORD_LIST_ENTRY_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: RECORD_LIST_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'company',
  label: 'Company',
  description: 'Company represented by this list entry.',
  icon: 'IconBuildingSkyscraper',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    COMPANY_RECORD_LIST_ENTRIES_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'companyId',
  },
});
