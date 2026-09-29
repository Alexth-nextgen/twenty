import { gql } from '@apollo/client';

export const SYNC_RECORD_LIST_RELATED_FIELD = gql`
  mutation SyncRecordListRelatedField(
    $recordListId: UUID!
    $sourceFieldMetadataId: UUID!
    $sourceRecordId: UUID
  ) {
    syncRecordListRelatedField(
      recordListId: $recordListId
      sourceFieldMetadataId: $sourceFieldMetadataId
      sourceRecordId: $sourceRecordId
    )
  }
`;
