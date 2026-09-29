import { lazy } from 'react';

import { NATIVE_APP_DEFINITIONS } from '~/native-apps/registry';
import { type NativeAppDefinition } from '@/app/native-extension-host/types/NativeAppDefinition';

// Stable ordering contract for every extension point: lower position first, ties
// broken by the registration id so the order never depends on registry order.
const sortByPosition = <TEntry extends { id: string; position: number }>(
  entries: TEntry[],
): TEntry[] =>
  entries.toSorted((left, right) => {
    const positionDelta = left.position - right.position;

    return positionDelta !== 0
      ? positionDelta
      : left.id.localeCompare(right.id);
  });

export const getNativeAppNavigationEntries = (
  definitions: NativeAppDefinition[] = NATIVE_APP_DEFINITIONS,
) =>
  sortByPosition(
    definitions.flatMap((application) =>
      application.navigation.map((entry) => ({
        applicationId: application.universalIdentifier,
        id: entry.id,
        position: entry.position,
        // React needs the same component instance across renders; callers build
        // these lists once per registry change instead of on every render.
        Component: lazy(entry.load),
      })),
    ),
  );

export const getNativeAppRecordSections = (
  definitions: NativeAppDefinition[] = NATIVE_APP_DEFINITIONS,
) =>
  sortByPosition(
    definitions.flatMap((application) =>
      application.recordSections.map((entry) => ({
        applicationId: application.universalIdentifier,
        id: entry.id,
        position: entry.position,
        objectNames: entry.objectNames,
        Component: lazy(entry.load),
      })),
    ),
  );

// Registrations are only active while their application is installed and enabled,
// so every entry point resolves through the activation state instead of being
// compiled in permanently.
export const isNativeApplicationEnabled = ({
  applications,
  applicationId,
}: {
  applications: { universalIdentifier: string; isEnabled: boolean }[];
  applicationId: string;
}) =>
  applications.some(
    (application) =>
      application.universalIdentifier === applicationId &&
      application.isEnabled,
  );

export const findNativeAppCommand = (
  commandKey: string,
  definitions: NativeAppDefinition[] = NATIVE_APP_DEFINITIONS,
  commandLabel?: string,
) => {
  for (const application of definitions) {
    const command = application.commands.find(
      (entry) => entry.key === commandKey,
    );

    if (command)
      return {
        applicationId: application.universalIdentifier,
        Component: lazy(command.load),
      };
  }

  if (!commandLabel) {
    return undefined;
  }

  const labelMatches = definitions.flatMap((application) =>
    application.commands
      .filter(
        (command) =>
          command.label === commandLabel ||
          command.shortLabel === commandLabel,
      )
      .map((command) => ({ application, command })),
  );

  if (labelMatches.length !== 1) {
    return undefined;
  }

  const [{ application, command }] = labelMatches;

  return {
    applicationId: application.universalIdentifier,
    Component: lazy(command.load),
  };

};

export const getNativeAppRoutePaths = (
  definitions: NativeAppDefinition[] = NATIVE_APP_DEFINITIONS,
) =>
  definitions.flatMap((application) =>
    application.routes.map(({ path }) => path),
  );
