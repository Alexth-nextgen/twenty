import { type EnrichedObjectMetadataItem } from '@/app/native-extension-host/api/modules/object-metadata/types/EnrichedObjectMetadataItem';
import { FieldMetadataType } from '@/app/native-extension-host/api/generated-metadata/graphql';

const RECORD_LIST_CARD_SYSTEM_FIELD_NAMES = ['createdBy', 'createdAt'];

export const getRecordListCardFieldMetadataItems = ({
  objectMetadataItem,
  groupByFieldMetadataId,
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
  groupByFieldMetadataId?: string | null;
}) =>
  objectMetadataItem.fields
    .filter(
      (fieldMetadataItem) =>
        fieldMetadataItem.name !== 'sourceRecord' &&
        fieldMetadataItem.id !== groupByFieldMetadataId &&
        (fieldMetadataItem.name === 'createdBy' ||
          (fieldMetadataItem.type !== FieldMetadataType.RELATION &&
            fieldMetadataItem.type !== FieldMetadataType.MORPH_RELATION)) &&
        (!fieldMetadataItem.isSystem ||
          RECORD_LIST_CARD_SYSTEM_FIELD_NAMES.includes(fieldMetadataItem.name)),
    )
    .toSorted((firstField, secondField) =>
      Number(firstField.isSystem) - Number(secondField.isSystem),
    );
