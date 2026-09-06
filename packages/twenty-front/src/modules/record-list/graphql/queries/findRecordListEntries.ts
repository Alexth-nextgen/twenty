import { gql } from '@apollo/client';

import { RECORD_LIST_ENTRY_FRAGMENT } from '@/record-list/graphql/fragments/recordListEntryFragment';

export const FIND_RECORD_LIST_ENTRIES = gql`
  ${RECORD_LIST_ENTRY_FRAGMENT}
  query FindRecordListEntries($recordListId: UUID!) {
    recordListEntries(recordListId: $recordListId) {
      ...RecordListEntryFields
    }
  }
`;
