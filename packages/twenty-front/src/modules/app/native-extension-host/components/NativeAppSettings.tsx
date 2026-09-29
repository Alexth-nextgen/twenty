import { gql } from '@apollo/client';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useState } from 'react';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import {
  useNativeApplications,
  NATIVE_APPLICATIONS,
  type NativeApplicationStatus,
} from '@/app/native-extension-host/hooks/useNativeApplications';
import { ConfirmationModal } from '@/app/native-extension-host/api/modules/ui/layout/modal/components/ConfirmationModal';
import {
  NativeAppModalProvider,
  useModal,
} from '@/app/native-extension-host/api/modules/ui/layout/modal/hooks/useModal';

const MANAGE_NATIVE_APPLICATION = gql`
  mutation ManageNativeApplication(
    $universalIdentifier: String!
    $action: String!
  ) {
    manageNativeApplication(
      universalIdentifier: $universalIdentifier
      action: $action
    ) {
      universalIdentifier
      displayName
      version
      hostCapability
      isEnabled
    }
  }
`;

const NATIVE_APPLICATION_RESOURCES = gql`
  query NativeApplicationResources($universalIdentifier: String!) {
    nativeApplicationResources(universalIdentifier: $universalIdentifier) {
      kind
      id
    }
  }
`;

const StyledApplication = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]} 0;
`;

const StyledMuted = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
`;

const StyledActions = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledImpactLine = styled.div`
  color: ${themeCssVariables.font.color.secondary};
`;

const getUninstallImpactSummary = (
  resources: { kind: string; id: string }[],
) => {
  const countByKind = resources.reduce<Record<string, number>>(
    (counts, resource) => ({
      ...counts,
      [resource.kind]: (counts[resource.kind] ?? 0) + 1,
    }),
    {},
  );

  return Object.entries(countByKind)
    .map(([kind, count]) => `${count} ${kind}`)
    .join(', ');
};

export const NativeAppSettings = () => (
  <NativeAppModalProvider>
    <NativeAppSettingsContent />
  </NativeAppModalProvider>
);

const NativeAppSettingsContent = () => {
  const { applications, loading, error } = useNativeApplications();
  const [uninstallTarget, setUninstallTarget] =
    useState<NativeApplicationStatus | null>(null);
  const { openModal, closeModal } = useModal();
  const [loadResources, { data: resourcesData, loading: loadingResources }] =
    useLazyQuery<{
      nativeApplicationResources: { kind: string; id: string }[];
    }>(NATIVE_APPLICATION_RESOURCES);
  const [manage, { loading: saving, error: mutationError }] = useMutation<{
    manageNativeApplication: NativeApplicationStatus[];
  }>(MANAGE_NATIVE_APPLICATION, {
    update(cache, { data }) {
      if (data)
        cache.writeQuery({
          query: NATIVE_APPLICATIONS,
          data: { nativeApplications: data.manageNativeApplication },
        });
    },
  });

  const manageApplication = (
    application: NativeApplicationStatus,
    action: 'disable' | 'install' | 'upgrade',
  ) =>
    manage({
      variables: {
        universalIdentifier: application.universalIdentifier,
        action,
      },
    }).catch(() => undefined);

  const openUninstallConfirmation = async (
    application: NativeApplicationStatus,
  ) => {
    setUninstallTarget(application);
    await loadResources({
      variables: { universalIdentifier: application.universalIdentifier },
    }).catch(() => undefined);
    openModal(`native-app-uninstall-${application.universalIdentifier}`);
  };

  const confirmUninstall = async () => {
    if (uninstallTarget === null) return;
    await manage({
      variables: {
        universalIdentifier: uninstallTarget.universalIdentifier,
        action: 'uninstall',
      },
    }).catch(() => undefined);
    closeModal(`native-app-uninstall-${uninstallTarget.universalIdentifier}`);
    setUninstallTarget(null);
  };

  if (loading && applications.length === 0)
    return <div>{t`Loading applications…`}</div>;

  const uninstallModalId = uninstallTarget
    ? `native-app-uninstall-${uninstallTarget.universalIdentifier}`
    : null;
  const resources = resourcesData?.nativeApplicationResources ?? [];

  return (
    <>
      {(error || mutationError) && (
        <div role="alert">
          {mutationError?.message ?? t`The application could not be updated.`}
        </div>
      )}
      {applications.map((application) => (
        <StyledApplication key={application.universalIdentifier}>
          <h3>{application.displayName}</h3>
          <StyledMuted>
            {application.version} · {application.hostCapability} ·{' '}
            {application.isEnabled ? t`Enabled` : t`Disabled`}
          </StyledMuted>
          <StyledActions>
            <Button
              title={application.isEnabled ? t`Disable` : t`Install or enable`}
              disabled={saving}
              onClick={() =>
                void manageApplication(
                  application,
                  application.isEnabled ? 'disable' : 'install',
                )
              }
            />
            {application.isEnabled && (
              <Button
                title={t`Refresh app`}
                disabled={saving}
                onClick={() =>
                  void manageApplication(application, 'upgrade')
                }
              />
            )}
            <Button
              title={t`Uninstall…`}
              accent="danger"
              disabled={saving}
              onClick={() => void openUninstallConfirmation(application)}
            />
          </StyledActions>
        </StyledApplication>
      ))}
      {uninstallModalId && uninstallTarget && (
        <ConfirmationModal
          modalInstanceId={uninstallModalId}
          title={t`Uninstall ${uninstallTarget.displayName}?`}
          subtitle={
            <>
              <StyledImpactLine>
                {t`Affected data: ${getUninstallImpactSummary(resources) || t`no tracked data`}`}
              </StyledImpactLine>
              <StyledImpactLine>
                {t`Uninstalling only disables the application. Its data stays in this workspace and a later install reconnects to it.`}
              </StyledImpactLine>
            </>
          }
          onConfirmClick={() => void confirmUninstall()}
          confirmButtonText={t`Uninstall`}
          loading={loadingResources || saving}
          onClose={() => {
            if (uninstallModalId) closeModal(uninstallModalId);
            setUninstallTarget(null);
          }}
        />
      )}
    </>
  );
};
