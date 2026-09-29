import { gql } from '@apollo/client';

export const RECORD_LIST_ENTRY_FRAGMENT = gql`
  fragment RecordListEntryFields on RecordListEntry {
    id
    sourceRecordId
    position
    createdAt
    updatedAt
  }
`;
