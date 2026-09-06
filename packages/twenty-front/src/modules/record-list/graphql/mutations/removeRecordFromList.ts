import { gql } from '@apollo/client';

import { RECORD_LIST_ENTRY_FRAGMENT } from '@/record-list/graphql/fragments/recordListEntryFragment';

export const REMOVE_RECORD_FROM_LIST = gql`
  ${RECORD_LIST_ENTRY_FRAGMENT}
  mutation RemoveRecordFromList($recordListId: UUID!, $entryId: UUID!) {
    removeRecordFromList(recordListId: $recordListId, entryId: $entryId) {
      ...RecordListEntryFields
    }
  }
`;
