import { useQuery } from '@apollo/client/react';

import { FIND_RECORD_LISTS } from '@/record-list/graphql/queries/findRecordLists';
import { type RecordList } from '@/record-list/types/RecordList';

const EMPTY_RECORD_LISTS: RecordList[] = [];

export const useRecordLists = () => {
  const query = useQuery<{ recordLists: RecordList[] }>(FIND_RECORD_LISTS);

  return {
    ...query,
    recordLists: query.data?.recordLists ?? EMPTY_RECORD_LISTS,
  };
};
