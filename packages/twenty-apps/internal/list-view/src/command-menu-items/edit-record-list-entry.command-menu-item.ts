import { defineCommandMenuItem } from 'twenty-sdk/define';

import {
  EDIT_RECORD_LIST_ENTRY_COMMAND_UNIVERSAL_IDENTIFIER,
  EDIT_RECORD_LIST_ENTRY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: EDIT_RECORD_LIST_ENTRY_COMMAND_UNIVERSAL_IDENTIFIER,
  label: 'Edit list entry',
  shortLabel: 'Edit entry',
  isPinned: true,
  availabilityType: 'RECORD_SELECTION',
  frontComponentUniversalIdentifier:
    EDIT_RECORD_LIST_ENTRY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
});
