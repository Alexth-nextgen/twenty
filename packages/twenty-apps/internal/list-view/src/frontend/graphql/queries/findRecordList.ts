import { gql } from '@apollo/client';

import { RECORD_LIST_FRAGMENT } from '../fragments/recordListFragment';

export const FIND_RECORD_LIST = gql`
  ${RECORD_LIST_FRAGMENT}
  query FindRecordList($id: UUID!) {
    recordList(id: $id) {
      ...RecordListFields
    }
  }
`;
