import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { getGroupByAggregateQueryName } from '@/object-record/record-aggregate/utils/getGroupByAggregateQueryName';
import { capitalize } from 'twenty-shared/utils';
import { getAggregateQueryName } from '@/object-record/utils/getAggregateQueryName';

export const useRefetchFindManyRecords = ({
  objectMetadataNamePlural,
  includeAggregateQueries = false,
}: {
  objectMetadataNamePlural: string;
  includeAggregateQueries?: boolean;
}) => {
  const apolloCoreClient = useApolloCoreClient();

  const refetchFindManyRecords = async () => {
    const findManyRecordsQueryName = `FindMany${capitalize(
      objectMetadataNamePlural,
    )}`;

    const queryNames = [findManyRecordsQueryName];

    if (includeAggregateQueries) {
      queryNames.push(
        getAggregateQueryName(objectMetadataNamePlural),
        getGroupByAggregateQueryName({ objectMetadataNamePlural }),
      );
    }

    await apolloCoreClient.refetchQueries({ include: queryNames });
  };

  return {
    refetchFindManyRecords,
  };
};
