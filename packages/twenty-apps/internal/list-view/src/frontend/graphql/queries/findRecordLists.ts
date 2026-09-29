import { gql } from '@apollo/client';

import { RECORD_LIST_FRAGMENT } from '../fragments/recordListFragment';

export const FIND_RECORD_LISTS = gql`
  ${RECORD_LIST_FRAGMENT}
  query FindRecordLists {
    recordLists {
      ...RecordListFields
    }
  }
`;
