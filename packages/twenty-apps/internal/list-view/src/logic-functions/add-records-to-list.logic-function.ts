import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';
import { type RoutePayload } from 'twenty-sdk/logic-function';

import {
  ADD_RECORDS_TO_LIST_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  RECORD_LIST_TARGET_COMPANIES,
  RECORD_LIST_TARGET_PEOPLE,
} from 'src/constants/universal-identifiers';

type AddRecordsToListBody = {
  listId?: string;
  recordIds?: string[];
  target?: string;
};

const handler = async (event: RoutePayload) => {
  const body = (event.body ?? {}) as AddRecordsToListBody;
  const listId = body.listId?.trim();
  const recordIds = [...new Set(body.recordIds ?? [])].filter(
    (recordId) => recordId.trim() !== '',
  );
  const target = body.target;

  if (
    !listId ||
    recordIds.length === 0 ||
    ![RECORD_LIST_TARGET_PEOPLE, RECORD_LIST_TARGET_COMPANIES].includes(
      target ?? '',
    )
  ) {
    throw new Error('A list, target and at least one record are required.');
  }

  const client = new CoreApiClient({ runAs: 'application' });
  const { recordLists } = await client.query({
    recordLists: {
      __args: {
        filter: { id: { eq: listId } },
        first: 1,
      },
      edges: {
        node: {
          id: true,
          target: true,
        },
      },
    },
  });
  const recordList = recordLists?.edges?.[0]?.node;

  if (!recordList || recordList.target !== target) {
    throw new Error('The selected list does not accept this record type.');
  }

  const results = await Promise.allSettled(
    recordIds.map((recordId) =>
      client.mutation({
        createRecordListEntry: {
          __args: {
            data: {
              name: `${target === RECORD_LIST_TARGET_PEOPLE ? 'Person' : 'Company'} list entry`,
              listId,
              ...(target === RECORD_LIST_TARGET_PEOPLE
                ? { personId: recordId }
                : { companyId: recordId }),
            },
          },
          id: true,
        },
      }),
    ),
  );
  const addedCount = results.filter(
    (result) => result.status === 'fulfilled',
  ).length;

  return {
    addedCount,
    skippedCount: results.length - addedCount,
  };
};

export default defineLogicFunction({
  universalIdentifier: ADD_RECORDS_TO_LIST_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'add-records-to-list',
  description: 'Adds selected People or Companies to a Lists app list.',
  timeoutSeconds: 15,
  handler,
  httpRouteTriggerSettings: {
    path: '/lists/add-records',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
