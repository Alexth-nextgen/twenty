import { type ApolloCache } from '@apollo/client';

export const evictRecordListEntriesFromCache = (
  cache: ApolloCache,
  recordListId: string | undefined,
) => {
  cache.evict({
    id: 'ROOT_QUERY',
    fieldName: 'recordListEntries',
    ...(recordListId ? { args: { recordListId } } : {}),
  });
};
