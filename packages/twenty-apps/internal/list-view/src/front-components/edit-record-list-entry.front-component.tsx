import { defineFrontComponent } from 'twenty-sdk/define';

import { EDIT_RECORD_LIST_ENTRY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { EditRecordListEntry } from 'src/front-components/components/EditRecordListEntry';

export default defineFrontComponent({
  universalIdentifier:
    EDIT_RECORD_LIST_ENTRY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'edit-record-list-entry',
  description: 'Edits all fields on a selected list entry.',
  component: EditRecordListEntry,
});
