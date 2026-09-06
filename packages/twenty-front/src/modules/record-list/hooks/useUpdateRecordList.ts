import { useMutation } from '@apollo/client/react';

import { UPDATE_RECORD_LIST } from '@/record-list/graphql/mutations/updateRecordList';
import { FIND_RECORD_LIST } from '@/record-list/graphql/queries/findRecordList';
import { FIND_RECORD_LISTS } from '@/record-list/graphql/queries/findRecordLists';
import { type RecordList } from '@/record-list/types/RecordList';

export const useUpdateRecordList = (recordListId: string) => {
  const [updateRecordListMutation, mutationState] = useMutation<
    { updateRecordList: RecordList },
    { input: { id: string; name?: string; icon?: string | null } }
  >(UPDATE_RECORD_LIST, {
    refetchQueries: [
      { query: FIND_RECORD_LISTS },
      { query: FIND_RECORD_LIST, variables: { id: recordListId } },
    ],
  });

  const updateRecordList = async (input: {
    name?: string;
    icon?: string | null;
  }) =>
    await updateRecordListMutation({
      variables: { input: { id: recordListId, ...input } },
    });

  return { updateRecordList, ...mutationState };
};
