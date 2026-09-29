import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';

export const DEFAULT_SEARCH_REQUEST_LIMIT = 60;

export const useOptionsForSelect = (fieldMetadataId: string) => {
  const { objectMetadataItem } = useRecordIndexContextOrThrow();

  const fieldMetadataItem = objectMetadataItem.readableFields.find(
    (field) => field.id === fieldMetadataId,
  );

  const selectOptions = fieldMetadataItem?.options;

  return {
    selectOptions,
  };
};
