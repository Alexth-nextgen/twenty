import { useMutation } from '@apollo/client/react';

import { CREATE_RECORD_LIST } from '@/record-list/graphql/mutations/createRecordList';
import { FIND_RECORD_LISTS } from '@/record-list/graphql/queries/findRecordLists';
import { type RecordList } from '@/record-list/types/RecordList';

export const useCreateRecordList = () => {
  const [createRecordListMutation, mutationState] = useMutation<
    { createRecordList: RecordList },
    {
      input: {
        name: string;
        icon?: string | null;
        parentObjectMetadataId: string;
      };
    }
  >(CREATE_RECORD_LIST, {
    refetchQueries: [{ query: FIND_RECORD_LISTS }],
  });

  const createRecordList = async (input: {
    name: string;
    icon?: string | null;
    parentObjectMetadataId: string;
  }) => {
    const result = await createRecordListMutation({ variables: { input } });

    return result.data?.createRecordList;
  };

  return { createRecordList, ...mutationState };
};
