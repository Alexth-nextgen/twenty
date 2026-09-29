import { t } from '@lingui/core/macro';

import { useHeadlessCommandContextApi } from '@/app/native-extension-host/api/modules/command-menu-item/engine-command/hooks/useHeadlessCommandContextApi';
import { useUnmountCommand } from '@/app/native-extension-host/api/modules/command-menu-item/engine-command/hooks/useUnmountEngineCommand';
import { CommandComponentInstanceContext } from '@/app/native-extension-host/api/modules/command-menu-item/engine-command/states/contexts/CommandComponentInstanceContext';
import { useAvailableComponentInstanceIdOrThrow } from '@/app/native-extension-host/api/modules/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';

// A native app command renderer only needs the host command context. It is
// intentionally read-only: it proves that the command extension point works for
// any app, not just for ListView.
export const HostSampleCommand = () => {
  const { objectMetadataItem } = useHeadlessCommandContextApi();
  const commandMenuItemId = useAvailableComponentInstanceIdOrThrow(
    CommandComponentInstanceContext,
  );
  const unmountCommand = useUnmountCommand();

  return (
    <div data-testid="native-host-sample-command">
      <p>{t`Native host sample command`}</p>
      <p>
        {objectMetadataItem?.nameSingular
          ? t`Rendered for ${objectMetadataItem.nameSingular}.`
          : t`No object in context.`}
      </p>
      <button type="button" onClick={() => unmountCommand(commandMenuItemId)}>
        {t`Close`}
      </button>
    </div>
  );
};
