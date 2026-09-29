import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

export const NATIVE_APPLICATIONS = gql`
  query NativeApplications {
    nativeApplications {
      universalIdentifier
      displayName
      version
      hostCapability
      isEnabled
    }
  }
`;
export type NativeApplicationStatus = {
  universalIdentifier: string;
  displayName: string;
  version: string;
  hostCapability: string;
  isEnabled: boolean;
};

export const useNativeApplications = () => {
  const query = useQuery<{ nativeApplications: NativeApplicationStatus[] }>(
    NATIVE_APPLICATIONS,
    {
      fetchPolicy: 'cache-and-network',
      pollInterval: 15000,
    },
  );
  return { ...query, applications: query.data?.nativeApplications ?? [] };
};
