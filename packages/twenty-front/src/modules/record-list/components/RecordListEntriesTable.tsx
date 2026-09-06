import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useMemo } from 'react';
import { AppPath } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';
import { LightIconButton } from 'twenty-ui/input';
import { IconTrash } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useMapToObjectRecordIdentifier } from '@/object-metadata/hooks/useMapToObjectRecordIdentifier';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useRecordListEntries } from '@/record-list/hooks/useRecordListEntries';

const StyledTableContainer = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
`;

const StyledHeaderCell = styled.th`
  border-bottom: 1px solid ${themeCssVariables.border.color.medium};
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  height: 32px;
  padding: 0 ${themeCssVariables.spacing[3]};
  text-align: left;
`;

const StyledCell = styled.td`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.secondary};
  height: 40px;
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledRecordLink = styled.a`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.medium};
  text-decoration: none;
`;

const StyledEmpty = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex: 1;
  justify-content: center;
  padding: ${themeCssVariables.spacing[8]};
`;

type RecordListEntriesTableProps = {
  recordListId: string;
  objectNameSingular: string;
};

export const RecordListEntriesTable = ({
  recordListId,
  objectNameSingular,
}: RecordListEntriesTableProps) => {
  const { recordListEntries, removeRecordFromList, isRemovingRecord } =
    useRecordListEntries(recordListId);
  const sourceRecordIds = recordListEntries.map(
    (recordListEntry) => recordListEntry.sourceRecordId,
  );
  const { records } = useFindManyRecords({
    objectNameSingular,
    filter: { id: { in: sourceRecordIds } },
    limit: Math.max(sourceRecordIds.length, 1),
    skip: sourceRecordIds.length === 0,
  });
  const { mapToObjectRecordIdentifier } = useMapToObjectRecordIdentifier({
    objectNameSingular,
    allowRequestsToTwentyIcons: true,
  });
  const recordsById = useMemo(
    () =>
      new Map(
        records.map((record: ObjectRecord) => [
          record.id,
          mapToObjectRecordIdentifier(record),
        ]),
      ),
    [mapToObjectRecordIdentifier, records],
  );

  if (recordListEntries.length === 0) {
    return (
      <StyledEmpty>{t`This list is empty. Add your first record.`}</StyledEmpty>
    );
  }

  return (
    <StyledTableContainer>
      <StyledTable>
        <thead>
          <tr>
            <StyledHeaderCell>{t`Record`}</StyledHeaderCell>
            <StyledHeaderCell>{t`Added`}</StyledHeaderCell>
            <StyledHeaderCell aria-label={t`Actions`} />
          </tr>
        </thead>
        <tbody>
          {recordListEntries.map((recordListEntry) => {
            const recordIdentifier = recordsById.get(
              recordListEntry.sourceRecordId,
            );
            const recordPath = getAppPath(AppPath.RecordShowPage, {
              objectNameSingular,
              objectRecordId: recordListEntry.sourceRecordId,
            });

            return (
              <tr key={recordListEntry.id}>
                <StyledCell>
                  <StyledRecordLink href={recordPath}>
                    {recordIdentifier?.name ?? recordListEntry.sourceRecordId}
                  </StyledRecordLink>
                </StyledCell>
                <StyledCell>
                  {new Intl.DateTimeFormat(undefined, {
                    dateStyle: 'medium',
                  }).format(new Date(recordListEntry.createdAt))}
                </StyledCell>
                <StyledCell>
                  <LightIconButton
                    Icon={IconTrash}
                    aria-label={t`Remove from list`}
                    accent="tertiary"
                    size="small"
                    disabled={isRemovingRecord}
                    onClick={() =>
                      void removeRecordFromList(recordListEntry.id)
                    }
                  />
                </StyledCell>
              </tr>
            );
          })}
        </tbody>
      </StyledTable>
    </StyledTableContainer>
  );
};
