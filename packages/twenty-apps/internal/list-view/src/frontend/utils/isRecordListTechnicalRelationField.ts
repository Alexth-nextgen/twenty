import { type FieldMetadataItem } from '@/app/native-extension-host/api/modules/object-metadata/types/FieldMetadataItem';
import { FieldMetadataType } from '@/app/native-extension-host/api/generated-metadata/graphql';

export const isRecordListTechnicalRelationField = (
  fieldMetadataItem: FieldMetadataItem,
) =>
  fieldMetadataItem.type === FieldMetadataType.RELATION &&
  fieldMetadataItem.relation?.targetObjectMetadata.nameSingular.startsWith(
    'recordListEntry',
  ) === true;
