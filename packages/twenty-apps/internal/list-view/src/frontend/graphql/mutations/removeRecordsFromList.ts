import { gql } from '@apollo/client';

export const REMOVE_RECORDS_FROM_LIST = gql`
  mutation RemoveRecordsFromList($recordListId: UUID!, $entryIds: [UUID!]!) {
    removeRecordsFromList(recordListId: $recordListId, entryIds: $entryIds) {
      removedCount
      skippedCount
    }
  }
`;
