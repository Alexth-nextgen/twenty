import { NativeAppCommand } from '@/app/native-extension-host/components/NativeAppSlot';
import { CommandMenuItemErrorBoundary } from '@/command-menu-item/display/components/CommandMenuItemErrorBoundary';
import { commandMenuItemsSelector } from '@/command-menu-item/states/commandMenuItemsSelector';
import { ENGINE_COMPONENT_KEY_COMPONENT_MAP } from '@/command-menu-item/engine-command/constants/EngineComponentKeyHeadlessComponentMap';
import { useUnmountCommand } from '@/command-menu-item/engine-command/hooks/useUnmountEngineCommand';
import { CommandComponentInstanceContext } from '@/command-menu-item/engine-command/states/contexts/CommandComponentInstanceContext';
import { headlessCommandContextApisState } from '@/command-menu-item/engine-command/states/headlessCommandContextApisState';
import { ContextStoreComponentInstanceContext } from '@/context-store/states/contexts/ContextStoreComponentInstanceContext';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

export const CommandRunner = () => {
  const headlessCommandContextApis = useAtomStateValue(
    headlessCommandContextApisState,
  );
  const unmountCommand = useUnmountCommand();
  const commandMenuItems = useAtomStateValue(commandMenuItemsSelector);

  return (
    <>
      {[...headlessCommandContextApis.entries()].map(
        ([commandMenuItemId, context]) => (
          <ContextStoreComponentInstanceContext.Provider
            key={commandMenuItemId}
            value={{ instanceId: context.contextStoreInstanceId }}
          >
            <CommandComponentInstanceContext.Provider
              value={{ instanceId: commandMenuItemId }}
            >
              <CommandMenuItemErrorBoundary
                shouldReportToSentry
                onError={() => unmountCommand(commandMenuItemId)}
              >
                {ENGINE_COMPONENT_KEY_COMPONENT_MAP[
                  context.engineComponentKey
                ] ?? (
                  <NativeAppCommand
                    commandLabel={commandMenuItems.find(
                      (item) => item.id === commandMenuItemId,
                    )?.label}
                    commandKey={
                      String(context.engineComponentKey) ===
                      'NATIVE_APP_COMMAND'
                        ? (commandMenuItems.find(
                            (item) => item.id === commandMenuItemId,
                          )?.universalIdentifier ?? '')
                        : context.engineComponentKey
                    }
                  />
                )}
              </CommandMenuItemErrorBoundary>
            </CommandComponentInstanceContext.Provider>
          </ContextStoreComponentInstanceContext.Provider>
        ),
      )}
    </>
  );
};
