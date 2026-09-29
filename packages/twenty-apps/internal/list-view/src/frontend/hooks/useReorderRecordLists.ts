import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

import { FIND_RECORD_LISTS } from '../graphql/queries/findRecordLists';
import { type RecordList } from '../types/RecordList';

const REORDER_RECORD_LISTS = gql`
  mutation ReorderRecordLists($ids: [UUID!]!) {
    reorderRecordLists(ids: $ids) {
      id
      position
    }
  }
`;

export const useReorderRecordLists = () => {
  const [reorderRecordListsMutation, mutationState] = useMutation<
    { reorderRecordLists: Pick<RecordList, 'id' | 'position'>[] },
    { ids: string[] }
  >(REORDER_RECORD_LISTS, { refetchQueries: [FIND_RECORD_LISTS] });

  const reorderRecordLists = async (ids: string[]) =>
    await reorderRecordListsMutation({ variables: { ids } });

  return { reorderRecordLists, ...mutationState };
};
