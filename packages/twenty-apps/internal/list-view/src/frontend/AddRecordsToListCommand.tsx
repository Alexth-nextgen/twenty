import { useEffect } from 'react';
import { isDefined } from 'twenty-shared/utils';

import { BulkAddRecordsToListModal } from './components/BulkAddRecordsToListModal';
import { useHeadlessCommandContextApi } from '@/app/native-extension-host/api/modules/command-menu-item/engine-command/hooks/useHeadlessCommandContextApi';
import { useUnmountCommand } from '@/app/native-extension-host/api/modules/command-menu-item/engine-command/hooks/useUnmountEngineCommand';
import { CommandComponentInstanceContext } from '@/app/native-extension-host/api/modules/command-menu-item/engine-command/states/contexts/CommandComponentInstanceContext';
import { useAvailableComponentInstanceIdOrThrow } from '@/app/native-extension-host/api/modules/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';

export const AddRecordsToListCommand = () => {
  const { objectMetadataItem, selectedRecords, targetedRecordsRule } =
    useHeadlessCommandContextApi();
  const commandMenuItemId = useAvailableComponentInstanceIdOrThrow(
    CommandComponentInstanceContext,
  );
  const unmountCommand = useUnmountCommand();

  const recordIds =
    targetedRecordsRule.mode === 'selection' &&
    targetedRecordsRule.selectedRecordIds.length > 0
      ? targetedRecordsRule.selectedRecordIds
      : selectedRecords.map((record) => record.id);
  const isValidRecordSelection =
    isDefined(objectMetadataItem) &&
    recordIds.length > 0 &&
    ['person', 'company'].includes(objectMetadataItem.nameSingular);

  useEffect(() => {
    if (!isValidRecordSelection) {
      unmountCommand(commandMenuItemId);
    }
  }, [commandMenuItemId, isValidRecordSelection, unmountCommand]);

  if (!isValidRecordSelection || !isDefined(objectMetadataItem)) {
    return null;
  }

  const handleClose = () => {
    unmountCommand(commandMenuItemId);
  };

  return (
    <BulkAddRecordsToListModal
      objectMetadataId={objectMetadataItem.id}
      recordIds={recordIds}
      onClose={handleClose}
    />
  );
};
