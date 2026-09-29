import { gql } from '@apollo/client';

export const ADD_RECORDS_TO_LIST = gql`
  mutation AddRecordsToList($input: AddRecordsToListInput!) {
    addRecordsToList(input: $input) {
      addedCount
      skippedCount
    }
  }
`;
