import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';
import { t } from '@lingui/core/macro';

import { HeadlessEngineCommandWrapperEffect } from '@/app/native-extension-host/api/modules/command-menu-item/engine-command/components/HeadlessEngineCommandWrapperEffect';
import { useHeadlessCommandContextApi } from '@/app/native-extension-host/api/modules/command-menu-item/engine-command/hooks/useHeadlessCommandContextApi';
import { useUnmountCommand } from '@/app/native-extension-host/api/modules/command-menu-item/engine-command/hooks/useUnmountEngineCommand';
import { CommandComponentInstanceContext } from '@/app/native-extension-host/api/modules/command-menu-item/engine-command/states/contexts/CommandComponentInstanceContext';
import { useAvailableComponentInstanceIdOrThrow } from '@/app/native-extension-host/api/modules/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';
import { useRefetchFindManyRecords } from '@/app/native-extension-host/api/modules/object-record/hooks/useRefetchFindManyRecords';
import { useResetTableRowSelection } from '@/app/native-extension-host/api/modules/object-record/hooks/useResetTableRowSelection';
import { useSnackBar } from '@/app/native-extension-host/api/modules/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useRemoveRecordsFromList } from './hooks/useRemoveRecordsFromList';

export const RemoveRecordsFromListCommand = () => {
  const { recordListId } = useParams<{ recordListId: string }>();
  const {
    objectMetadataItem,
    recordIndexId,
    targetedRecordsRule,
  } = useHeadlessCommandContextApi();
  const commandMenuItemId = useAvailableComponentInstanceIdOrThrow(
    CommandComponentInstanceContext,
  );
  const unmountCommand = useUnmountCommand();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const { removeRecordsFromList } = useRemoveRecordsFromList();
  const { refetchFindManyRecords } = useRefetchFindManyRecords({
    objectMetadataNamePlural: objectMetadataItem?.namePlural ?? '',
    includeAggregateQueries: true,
  });
  const { resetTableRowSelection } = useResetTableRowSelection(
    recordIndexId ?? undefined,
  );

  const entryIds =
    targetedRecordsRule.mode === 'selection'
      ? targetedRecordsRule.selectedRecordIds
      : [];
  const isValidSelection =
    isDefined(recordListId) &&
    isDefined(objectMetadataItem) &&
    objectMetadataItem.nameSingular.startsWith('recordListEntry') &&
    entryIds.length > 0;

  useEffect(() => {
    if (!isValidSelection) {
      unmountCommand(commandMenuItemId);
    }
  }, [commandMenuItemId, isValidSelection, unmountCommand]);

  if (
    !isValidSelection ||
    !isDefined(recordListId) ||
    !isDefined(objectMetadataItem)
  ) {
    return null;
  }

  const execute = async () => {
    try {
      const result = await removeRecordsFromList({ recordListId, entryIds });

      if (!isDefined(result)) {
        throw new Error('Bulk list removal did not return a result');
      }

      await refetchFindManyRecords();
      resetTableRowSelection();

      enqueueSuccessSnackBar({
        message:
          result.skippedCount > 0
            ? t`${result.removedCount} records removed, ${result.skippedCount} already removed`
            : t`${result.removedCount} records removed from list`,
      });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to remove records from list` });
    }
  };

  return <HeadlessEngineCommandWrapperEffect execute={execute} />;
};
