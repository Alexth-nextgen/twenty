import { defineView } from 'twenty-sdk/define';

import {
  RECORD_LIST_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  RECORD_LIST_OBJECT_UNIVERSAL_IDENTIFIER,
  RECORD_LIST_POSITION_FIELD_UNIVERSAL_IDENTIFIER,
  RECORD_LIST_TARGET_FIELD_UNIVERSAL_IDENTIFIER,
  RECORD_LISTS_VIEW_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  RECORD_LISTS_VIEW_POSITION_FIELD_UNIVERSAL_IDENTIFIER,
  RECORD_LISTS_VIEW_TARGET_FIELD_UNIVERSAL_IDENTIFIER,
  RECORD_LISTS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: RECORD_LISTS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'All lists',
  objectUniversalIdentifier: RECORD_LIST_OBJECT_UNIVERSAL_IDENTIFIER,
  icon: 'IconList',
  position: 0,
  fields: [
    {
      universalIdentifier: RECORD_LISTS_VIEW_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        RECORD_LIST_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 260,
    },
    {
      universalIdentifier: RECORD_LISTS_VIEW_TARGET_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        RECORD_LIST_TARGET_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier:
        RECORD_LISTS_VIEW_POSITION_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        RECORD_LIST_POSITION_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: false,
      size: 100,
    },
  ],
});
