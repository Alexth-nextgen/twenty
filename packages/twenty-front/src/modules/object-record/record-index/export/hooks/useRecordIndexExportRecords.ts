import { json2csv } from 'json-2-csv';
import { useMemo } from 'react';
import {
  utils as spreadsheetUtils,
  write as writeSpreadsheet,
} from 'xlsx-ugnis';

import { isCompositeFieldType } from '@/object-record/object-filter-dropdown/utils/isCompositeFieldType';
import { EXPORT_TABLE_DATA_DEFAULT_PAGE_SIZE } from '@/object-record/object-options-dropdown/constants/ExportTableDataDefaultPageSize';
import { useExportProcessRecordsForCSV } from '@/object-record/object-options-dropdown/hooks/useExportProcessRecordsForCSV';
import { type FieldMetadata } from '@/object-record/record-field/ui/types/FieldMetadata';
import {
  useRecordIndexLazyFetchRecords,
  type UseRecordDataOptions,
} from '@/object-record/record-index/export/hooks/useRecordIndexLazyFetchRecords';
import { type ColumnDefinition } from '@/object-record/record-table/types/ColumnDefinition';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { t } from '@lingui/core/macro';
import { saveAs } from 'file-saver';
import { COMPOSITE_FIELD_SUB_FIELD_LABELS } from 'twenty-shared/constants';
import {
  formatValueForCSV,
  isDefined,
  sanitizeValueForCSVExport,
} from 'twenty-shared/utils';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';
import { isUndefinedOrNull } from '~/utils/isUndefinedOrNull';

type GenerateExportOptions = {
  columns: Pick<
    ColumnDefinition<FieldMetadata>,
    'label' | 'type' | 'metadata'
  >[];
  rows: Record<string, any>[];
};

type GenerateExport = (data: GenerateExportOptions) => string;

type ExportProgress = {
  exportedRecordCount?: number;
  totalRecordCount?: number;
  displayType: 'percentage' | 'number';
};

export const generateCsv: GenerateExport = ({
  columns,
  rows,
}: GenerateExportOptions): string => {
  const columnsToExport = columns.filter(
    (col) =>
      !('relationType' in col.metadata && col.metadata.relationType) ||
      col.metadata.relationType === RelationType.MANY_TO_ONE,
  );

  const objectIdColumn: ColumnDefinition<FieldMetadata> = {
    fieldMetadataId: '',
    type: FieldMetadataType.UUID,
    iconName: '',
    label: `Id`,
    metadata: {
      fieldName: 'id',
    },
    position: 0,
    size: 0,
  };

  const columnsToExportWithIdColumn = [objectIdColumn, ...columnsToExport];

  const keys = columnsToExportWithIdColumn.flatMap((col) => {
    const headerLabel = `${col.label}${col.type === 'RELATION' ? ' Id' : ''}`;
    const column = {
      field: `${col.metadata.fieldName}${col.type === 'RELATION' ? 'Id' : ''}`,
      title: formatValueForCSV(sanitizeValueForCSVExport(headerLabel)),
    };

    const columnType = col.type;
    if (!isCompositeFieldType(columnType)) return [column];

    const nestedFieldsWithoutTypename = Object.keys(rows[0][column.field])
      .filter((key) => key !== '__typename')
      .map((key) => {
        const subFieldLabel = COMPOSITE_FIELD_SUB_FIELD_LABELS[columnType][key];
        return {
          field: `${column.field}.${key}`,
          title: formatValueForCSV(
            sanitizeValueForCSVExport(`${column.title} / ${subFieldLabel}`),
          ),
        };
      });

    return nestedFieldsWithoutTypename;
  });

  const sanitizedRows = rows.map((row) => {
    const sanitizedRow: Record<string, any> = {};

    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'string') {
        sanitizedRow[key] = sanitizeValueForCSVExport(value);
      } else if (isDefined(value) && typeof value === 'object') {
        sanitizedRow[key] = {};
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          if (typeof nestedValue === 'string') {
            sanitizedRow[key][nestedKey] =
              sanitizeValueForCSVExport(nestedValue);
          } else {
            sanitizedRow[key][nestedKey] = nestedValue;
          }
        }
      } else {
        sanitizedRow[key] = value;
      }
    }

    return sanitizedRow;
  });

  return json2csv(sanitizedRows, {
    keys,
    emptyFieldValue: '',
    excelBOM: true,
    // Note: We handle CSV injection prevention manually with ZWJ approach above
    // This preserves original which the csvSecurity option does not do
  });
};

const percentage = (part: number, whole: number): number => {
  return Math.round((part / whole) * 100);
};

export const displayedExportProgress = (progress?: ExportProgress): string => {
  if (isUndefinedOrNull(progress?.exportedRecordCount)) {
    return t`Export`;
  }

  if (
    progress.displayType === 'percentage' &&
    isDefined(progress?.totalRecordCount)
  ) {
    const percentageValue = percentage(
      progress.exportedRecordCount,
      progress.totalRecordCount,
    );
    return t`Export (${percentageValue}%)`;
  }

  const exportedCount = progress.exportedRecordCount;
  return t`Export (${exportedCount})`;
};

const downloader = (mimeType: string, generator: GenerateExport) => {
  return (filename: string, data: GenerateExportOptions) => {
    const blob = new Blob([generator(data)], { type: mimeType });
    saveAs(blob, filename);
  };
};

export const csvDownloader = downloader('text/csv', generateCsv);

export const generateXlsx = ({
  columns,
  rows,
}: GenerateExportOptions): ArrayBuffer => {
  const exportColumns = columns.filter(
    (column) =>
      !('relationType' in column.metadata && column.metadata.relationType) ||
      column.metadata.relationType === RelationType.MANY_TO_ONE,
  );
  const headers = [
    { fieldName: 'id', label: 'Id' },
    ...exportColumns.map((column) => ({
      fieldName: `${column.metadata.fieldName}${column.type === 'RELATION' ? 'Id' : ''}`,
      label: `${column.label}${column.type === 'RELATION' ? ' Id' : ''}`,
    })),
  ];
  const worksheetRows = rows.map((row) =>
    Object.fromEntries(
      headers.map(({ fieldName, label }) => {
        const value = row[fieldName];
        return [
          label,
          isDefined(value) && typeof value === 'object'
            ? JSON.stringify(value)
            : value,
        ];
      }),
    ),
  );
  const workbook = spreadsheetUtils.book_new();
  const worksheet = spreadsheetUtils.json_to_sheet(worksheetRows, {
    header: headers.map(({ label }) => label),
  });
  spreadsheetUtils.book_append_sheet(workbook, worksheet, 'Records');

  return writeSpreadsheet(workbook, { bookType: 'xlsx', type: 'array' });
};

export const xlsxDownloader = (
  filename: string,
  data: GenerateExportOptions,
) => {
  const blob = new Blob([generateXlsx(data)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, filename.replace(/\.csv$/i, '.xlsx'));
};

type UseExportTableDataOptions = Omit<UseRecordDataOptions, 'callback'> & {
  filename: string;
  format?: 'csv' | 'xlsx';
};

export const useRecordIndexExportRecords = ({
  delayMs,
  filename,
  format = 'csv',
  maximumRequests = 1000,
  objectMetadataItem,
  pageSize = EXPORT_TABLE_DATA_DEFAULT_PAGE_SIZE,
  recordIndexId,
  viewType,
}: UseExportTableDataOptions) => {
  const { processRecordsForCSVExport } = useExportProcessRecordsForCSV(
    objectMetadataItem.nameSingular,
  );

  const downloadCsv = useMemo(
    () =>
      (
        records: ObjectRecord[],
        columns: Pick<
          ColumnDefinition<FieldMetadata>,
          'label' | 'type' | 'metadata'
        >[],
      ) => {
        const recordsProcessedForExport = processRecordsForCSVExport(records);

        const exportData = { rows: recordsProcessedForExport, columns };
        if (format === 'xlsx') {
          xlsxDownloader(filename, exportData);
          return;
        }
        csvDownloader(filename, exportData);
      },
    [filename, format, processRecordsForCSVExport],
  );

  const { getTableData: download, progress } = useRecordIndexLazyFetchRecords({
    delayMs,
    maximumRequests,
    objectMetadataItem,
    pageSize,
    recordIndexId,
    callback: downloadCsv,
    viewType,
  });

  return { progress, download };
};
