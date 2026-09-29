import { gql } from '@apollo/client';

import { RECORD_LIST_FRAGMENT } from '../fragments/recordListFragment';

export const FIND_RECORD_LIST_MEMBERSHIPS = gql`
  ${RECORD_LIST_FRAGMENT}
  query FindRecordListMemberships(
    $sourceRecordId: UUID!
    $parentObjectMetadataId: UUID!
  ) {
    recordListMemberships(
      sourceRecordId: $sourceRecordId
      parentObjectMetadataId: $parentObjectMetadataId
    ) {
      id
      sourceRecordId
      position
      status
      values
      createdAt
      updatedAt
      recordList {
        ...RecordListFields
      }
    }
  }
`;
