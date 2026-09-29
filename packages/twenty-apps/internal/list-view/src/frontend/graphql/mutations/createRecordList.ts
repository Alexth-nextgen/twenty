import { gql } from '@apollo/client';

import { RECORD_LIST_FRAGMENT } from '../fragments/recordListFragment';

export const CREATE_RECORD_LIST = gql`
  ${RECORD_LIST_FRAGMENT}
  mutation CreateRecordList($input: CreateRecordListInput!) {
    createRecordList(input: $input) {
      ...RecordListFields
    }
  }
`;
