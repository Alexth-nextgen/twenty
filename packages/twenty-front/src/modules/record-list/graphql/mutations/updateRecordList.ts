import { gql } from '@apollo/client';

import { RECORD_LIST_FRAGMENT } from '@/record-list/graphql/fragments/recordListFragment';

export const UPDATE_RECORD_LIST = gql`
  ${RECORD_LIST_FRAGMENT}
  mutation UpdateRecordList($input: UpdateRecordListInput!) {
    updateRecordList(input: $input) {
      ...RecordListFields
    }
  }
`;
