import { useRecordIndexExportRecords } from '@/object-record/record-index/export/hooks/useRecordIndexExportRecords';
import { useRecordIndexIdFromCurrentContextStore } from '@/object-record/record-index/hooks/useRecordIndexIdFromCurrentContextStore';

export const useRecordIndexFileExport = ({
  filename,
  format,
}: {
  filename: string;
  format: 'csv' | 'xlsx';
}) => {
  const { objectMetadataItem, recordIndexId } =
    useRecordIndexIdFromCurrentContextStore();

  return useRecordIndexExportRecords({
    delayMs: 100,
    filename,
    format,
    objectMetadataItem,
    recordIndexId,
  });
};
