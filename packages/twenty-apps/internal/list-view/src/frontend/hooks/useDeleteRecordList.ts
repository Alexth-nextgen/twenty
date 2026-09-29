import { useMutation } from '@apollo/client/react';

import { DELETE_RECORD_LIST } from '../graphql/mutations/deleteRecordList';
import { FIND_RECORD_LISTS } from '../graphql/queries/findRecordLists';

export const useDeleteRecordList = () => {
  const [deleteRecordListMutation, mutationState] = useMutation<
    { deleteRecordList: { id: string } },
    { id: string }
  >(DELETE_RECORD_LIST, {
    refetchQueries: [{ query: FIND_RECORD_LISTS }],
  });

  const deleteRecordList = async (id: string) =>
    await deleteRecordListMutation({ variables: { id } });

  return { deleteRecordList, ...mutationState };
};
