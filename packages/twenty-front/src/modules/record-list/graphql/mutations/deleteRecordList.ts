import { gql } from '@apollo/client';

import { RECORD_LIST_FRAGMENT } from '@/record-list/graphql/fragments/recordListFragment';

export const DELETE_RECORD_LIST = gql`
  ${RECORD_LIST_FRAGMENT}
  mutation DeleteRecordList($id: UUID!) {
    deleteRecordList(id: $id) {
      ...RecordListFields
    }
  }
`;
