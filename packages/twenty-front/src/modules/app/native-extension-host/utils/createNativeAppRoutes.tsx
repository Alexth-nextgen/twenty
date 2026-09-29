import { lazy } from 'react';
import { type WorkspaceRouteObject } from '@/app/routing/types/WorkspaceRouteObject';
import { NativeAppBoundary } from '@/app/native-extension-host/components/NativeAppSlot';
import { NATIVE_APP_DEFINITIONS } from '~/native-apps/registry';

export const createNativeAppRoutes = (): WorkspaceRouteObject[] =>
  NATIVE_APP_DEFINITIONS.flatMap((application) =>
    application.routes.map((route) => {
      const Component = lazy(route.load);
      return {
        path: route.path,
        element: (
          <NativeAppBoundary applicationId={application.universalIdentifier}>
            <Component />
          </NativeAppBoundary>
        ),
        handle: {
          workspaceSurfaces: ['main', 'side-panel'],
          isLocationExpandableFromSidePanel: true,
        },
      };
    }),
  );
