import { currentUserWorkspaceState } from '@/auth/states/currentUserWorkspaceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { type PermissionFlagType } from '~/generated-metadata/graphql';

export const useHasPermissionFlag = (permissionFlag: PermissionFlagType) => {
  const currentUserWorkspace = useAtomStateValue(currentUserWorkspaceState);

  return (currentUserWorkspace?.permissionFlags ?? []).includes(permissionFlag);
};
