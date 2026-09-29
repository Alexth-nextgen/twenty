import { gql } from '@apollo/client';

export const RECORD_LIST_FRAGMENT = gql`
  fragment RecordListFields on RecordList {
    id
    name
    icon
    position
    parentObjectMetadataId
    entryObjectMetadataId
    defaultViewId
    createdAt
    updatedAt
  }
`;
