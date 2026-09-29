import {
  Suspense,
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
} from 'react';
import { t } from '@lingui/core/macro';
import { ErrorBoundary } from 'react-error-boundary';
import { useNativeApplications } from '@/app/native-extension-host/hooks/useNativeApplications';
import { useUnmountCommand } from '@/command-menu-item/engine-command/hooks/useUnmountEngineCommand';
import { CommandComponentInstanceContext } from '@/command-menu-item/engine-command/states/contexts/CommandComponentInstanceContext';
import { type NativeRecordSectionProps } from '@/app/native-extension-host/types/NativeAppDefinition';
import {
  findNativeAppCommand,
  getNativeAppNavigationEntries,
  getNativeAppRecordSections,
  isNativeApplicationEnabled,
} from '@/app/native-extension-host/utils/nativeAppRegistry';
import { useSnackBar } from '@/app/native-extension-host/api/modules/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useAvailableComponentInstanceIdOrThrow } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';
import { NativeAppModalProvider } from '@/app/native-extension-host/api/modules/ui/layout/modal/hooks/useModal';

export const NativeAppBoundary = ({
  applicationId,
  children,
  onError,
  onUnavailable,
}: {
  applicationId: string;
  children: ReactNode;
  onError?: () => void;
  onUnavailable?: () => void;
}) => {
  const { applications, loading } = useNativeApplications();
  const isEnabled = isNativeApplicationEnabled({ applications, applicationId });

  useEffect(() => {
    if (!loading && !isEnabled) {
      onUnavailable?.();
    }
  }, [isEnabled, loading, onUnavailable]);

  if (!isEnabled) return null;
  return (
    <NativeAppModalProvider>
      <ErrorBoundary
        fallbackRender={({ resetErrorBoundary }) => (
          <div role="alert">
            {t`The application could not be loaded.`}
            <button onClick={resetErrorBoundary}>{t`Try again`}</button>
          </div>
        )}
        onError={onError ? () => onError() : undefined}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </ErrorBoundary>
    </NativeAppModalProvider>
  );
};

// Built once: every entry carries a lazy React component and the registry is
// only replaced by a rebuild, never by rendering.
const navigation = getNativeAppNavigationEntries();
const recordSections = getNativeAppRecordSections();

export const NativeAppNavigation = () => (
  <>
    {navigation.map(({ id, applicationId, Component }) => (
      <NativeAppBoundary
        key={`${applicationId}:${id}`}
        applicationId={applicationId}
      >
        <Component />
      </NativeAppBoundary>
    ))}
  </>
);

export const NativeAppRecordSections = ({
  objectName,
  sourceRecordId,
  parentObjectMetadataId,
}: NativeRecordSectionProps & { objectName: string }) => (
  <>
    {recordSections
      .filter((entry) => entry.objectNames.includes(objectName))
      .map(({ id, applicationId, Component }) => (
        <NativeAppBoundary
          key={`${applicationId}:${id}`}
          applicationId={applicationId}
        >
          <Component
            sourceRecordId={sourceRecordId}
            parentObjectMetadataId={parentObjectMetadataId}
          />
        </NativeAppBoundary>
      ))}
  </>
);

export const NativeAppCommand = ({
  commandKey,
  commandLabel,
}: {
  commandKey: string;
  commandLabel?: string;
}) => {
  const entry = findNativeAppCommand(
    commandKey,
    undefined,
    commandLabel,
  );
  if (!entry) return <UnavailableNativeAppCommand />;
  return (
    <NativeAppCommandBoundary
      applicationId={entry.applicationId}
      Component={entry.Component}
    />
  );
};

const NativeAppCommandBoundary = ({
  applicationId,
  Component,
}: {
  applicationId: string;
  Component: ComponentType;
}) => {
  const commandMenuItemId = useAvailableComponentInstanceIdOrThrow(
    CommandComponentInstanceContext,
  );
  const unmountCommand = useUnmountCommand();
  const { enqueueErrorSnackBar } = useSnackBar();

  const handleError = useCallback(() => {
    enqueueErrorSnackBar({ message: t`The app command could not be loaded.` });
    unmountCommand(commandMenuItemId);
  }, [commandMenuItemId, enqueueErrorSnackBar, unmountCommand]);

  const handleUnavailable = useCallback(() => {
    enqueueErrorSnackBar({ message: t`This app is not enabled.` });
    unmountCommand(commandMenuItemId);
  }, [commandMenuItemId, enqueueErrorSnackBar, unmountCommand]);

  return (
    <NativeAppBoundary
      applicationId={applicationId}
      onError={handleError}
      onUnavailable={handleUnavailable}
    >
      <Component />
    </NativeAppBoundary>
  );
};

const UnavailableNativeAppCommand = () => {
  const commandMenuItemId = useAvailableComponentInstanceIdOrThrow(
    CommandComponentInstanceContext,
  );
  const unmountCommand = useUnmountCommand();
  const { enqueueErrorSnackBar } = useSnackBar();

  useEffect(() => {
    enqueueErrorSnackBar({
      message: t`This app command is no longer available.`,
    });
    unmountCommand(commandMenuItemId);
  }, [commandMenuItemId, enqueueErrorSnackBar, unmountCommand]);

  return null;
};
