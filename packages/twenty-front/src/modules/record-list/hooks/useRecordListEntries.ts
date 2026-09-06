import { useMutation, useQuery } from '@apollo/client/react';

import { ADD_RECORD_TO_LIST } from '@/record-list/graphql/mutations/addRecordToList';
import { REMOVE_RECORD_FROM_LIST } from '@/record-list/graphql/mutations/removeRecordFromList';
import { FIND_RECORD_LIST_ENTRIES } from '@/record-list/graphql/queries/findRecordListEntries';
import { type RecordListEntry } from '@/record-list/types/RecordList';

const EMPTY_RECORD_LIST_ENTRIES: RecordListEntry[] = [];

export const useRecordListEntries = (recordListId: string) => {
  const queryVariables = { recordListId };
  const query = useQuery<
    { recordListEntries: RecordListEntry[] },
    { recordListId: string }
  >(FIND_RECORD_LIST_ENTRIES, {
    variables: queryVariables,
    skip: recordListId.length === 0,
  });
  const [addMutation, addMutationState] = useMutation<
    { addRecordToList: RecordListEntry },
    { input: { recordListId: string; sourceRecordId: string } }
  >(ADD_RECORD_TO_LIST, {
    refetchQueries: [
      { query: FIND_RECORD_LIST_ENTRIES, variables: queryVariables },
    ],
  });
  const [removeMutation, removeMutationState] = useMutation<
    { removeRecordFromList: RecordListEntry },
    { recordListId: string; entryId: string }
  >(REMOVE_RECORD_FROM_LIST, {
    refetchQueries: [
      { query: FIND_RECORD_LIST_ENTRIES, variables: queryVariables },
    ],
  });

  const addRecordToList = async (sourceRecordId: string) =>
    await addMutation({
      variables: { input: { recordListId, sourceRecordId } },
    });

  const removeRecordFromList = async (entryId: string) =>
    await removeMutation({ variables: { recordListId, entryId } });

  return {
    ...query,
    recordListEntries:
      query.data?.recordListEntries ?? EMPTY_RECORD_LIST_ENTRIES,
    addRecordToList,
    removeRecordFromList,
    isAddingRecord: addMutationState.loading,
    isRemovingRecord: removeMutationState.loading,
  };
};
