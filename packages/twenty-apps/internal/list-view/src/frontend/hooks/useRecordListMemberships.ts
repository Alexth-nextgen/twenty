import { useMutation, useQuery } from '@apollo/client/react';

import { ADD_RECORD_TO_LIST } from '../graphql/mutations/addRecordToList';
import { REMOVE_RECORD_FROM_LIST } from '../graphql/mutations/removeRecordFromList';
import { FIND_RECORD_LIST_MEMBERSHIPS } from '../graphql/queries/findRecordListMemberships';
import { evictRecordListEntriesFromCache } from '../utils/evictRecordListEntriesFromCache';
import {
  type RecordListEntry,
  type RecordListMembership,
} from '../types/RecordList';

const EMPTY_MEMBERSHIPS: RecordListMembership[] = [];

export const useRecordListMemberships = ({
  sourceRecordId,
  parentObjectMetadataId,
}: {
  sourceRecordId: string;
  parentObjectMetadataId: string;
}) => {
  const variables = { sourceRecordId, parentObjectMetadataId };
  const query = useQuery<
    { recordListMemberships: RecordListMembership[] },
    typeof variables
  >(FIND_RECORD_LIST_MEMBERSHIPS, {
    variables,
    skip: sourceRecordId.length === 0 || parentObjectMetadataId.length === 0,
  });
  const refetchQueries = [{ query: FIND_RECORD_LIST_MEMBERSHIPS, variables }];
  const [addMutation, addState] = useMutation<
    { addRecordToList: RecordListEntry },
    { input: { recordListId: string; sourceRecordId: string } }
  >(ADD_RECORD_TO_LIST, {
    refetchQueries,
    awaitRefetchQueries: true,
    update: (cache) => {
      evictRecordListEntriesFromCache(cache, undefined);
    },
  });
  const [removeMutation, removeState] = useMutation<
    { removeRecordFromList: RecordListEntry },
    { recordListId: string; entryId: string }
  >(REMOVE_RECORD_FROM_LIST, {
    refetchQueries,
    awaitRefetchQueries: true,
    update: (cache) => {
      evictRecordListEntriesFromCache(cache, undefined);
    },
  });

  return {
    ...query,
    memberships: query.data?.recordListMemberships ?? EMPTY_MEMBERSHIPS,
    addToList: (recordListId: string) =>
      addMutation({
        variables: { input: { recordListId, sourceRecordId } },
      }),
    removeFromList: (recordListId: string, entryId: string) =>
      removeMutation({ variables: { recordListId, entryId } }),
    isAdding: addState.loading,
    isRemoving: removeState.loading,
  };
};
