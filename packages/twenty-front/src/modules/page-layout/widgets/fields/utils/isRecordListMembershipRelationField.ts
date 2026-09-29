import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { FieldMetadataType } from 'twenty-shared/types';

export const isRecordListMembershipRelationField = (
  fieldMetadataItem: FieldMetadataItem,
) =>
  fieldMetadataItem.name === 'listMemberships' ||
  (fieldMetadataItem.type === FieldMetadataType.RELATION &&
    fieldMetadataItem.relation?.targetObjectMetadata.nameSingular.startsWith(
      'recordListEntry',
    ) === true);
