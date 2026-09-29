import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import {
  type RecordGqlOperationFilter,
  FieldMetadataType,
} from 'twenty-shared/types';
import { capitalize, isDefined } from 'twenty-shared/utils';

export type HomeSignalFieldSettings = {
  lastActivityFieldMetadataId: string | null;
  nextStepDateFieldMetadataId: string | null;
  nextStepFieldMetadataId: string | null;
  objectMetadataId: string;
};

export type ResolvedOpportunitySignalFields = {
  lastActivityField: FieldMetadataItem | null;
  nextStepDateField: FieldMetadataItem | null;
  nextStepField: FieldMetadataItem | null;
};

export const LAST_ACTIVITY_FIELD_TYPES = [
  FieldMetadataType.DATE,
  FieldMetadataType.DATE_TIME,
];

export const NEXT_STEP_FIELD_TYPES = [
  FieldMetadataType.DATE,
  FieldMetadataType.DATE_TIME,
  FieldMetadataType.MULTI_SELECT,
  FieldMetadataType.SELECT,
  FieldMetadataType.TEXT,
];

/**
 * The activity timeline keeps one morph join column per target object. The API
 * exposes it as `<target><TargetObjectSingular>Id`, which is `targetOpportunityId`
 * for the standard opportunity object. Deriving the name instead of hardcoding it
 * keeps the dashboard working in a workspace that names the object differently,
 * or in a CRM that models the same relation under another object.
 */
export const getTimelineActivityTargetFieldName = (
  targetObjectNameSingular: string,
): string => `target${capitalize(targetObjectNameSingular)}Id`;

/**
 * Scopes the activity timeline to the records the dashboard actually tracks. The
 * join column filter is the same shape the record timeline uses when it loads the
 * activities of a single opportunity, so no unverified filter is invented here.
 */
export const buildOpportunityTimelineActivityFilter = ({
  opportunityIds,
  opportunityObjectNameSingular,
  windowStartsAt,
}: {
  opportunityIds: string[];
  opportunityObjectNameSingular: string;
  windowStartsAt: string;
}): RecordGqlOperationFilter => ({
  happensAt: { gte: windowStartsAt },
  [getTimelineActivityTargetFieldName(opportunityObjectNameSingular)]: {
    in: opportunityIds,
  },
});

export const getSignalFieldCandidates = ({
  fieldTypes,
  objectMetadataItem,
}: {
  fieldTypes: FieldMetadataType[];
  objectMetadataItem: EnrichedObjectMetadataItem | undefined;
}) =>
  (objectMetadataItem?.readableFields ?? [])
    .filter((fieldMetadataItem) => fieldTypes.includes(fieldMetadataItem.type))
    .sort((first, second) => first.label.localeCompare(second.label));

export const resolveOpportunitySignalFields = ({
  objectMetadataItem,
  settings,
}: {
  objectMetadataItem: EnrichedObjectMetadataItem | undefined;
  settings: HomeSignalFieldSettings | undefined;
}): ResolvedOpportunitySignalFields => {
  const findField = (fieldMetadataId: string | null | undefined) => {
    if (!isDefined(fieldMetadataId)) {
      return null;
    }

    return (
      objectMetadataItem?.readableFields.find(
        (fieldMetadataItem) => fieldMetadataItem.id === fieldMetadataId,
      ) ?? null
    );
  };

  return {
    lastActivityField: findField(settings?.lastActivityFieldMetadataId),
    nextStepDateField: findField(settings?.nextStepDateFieldMetadataId),
    nextStepField: findField(settings?.nextStepFieldMetadataId),
  };
};

export const getMappedFieldTextValue = (
  record: Record<string, unknown>,
  fieldMetadataItem: FieldMetadataItem | null,
): string | null => {
  if (!isDefined(fieldMetadataItem)) {
    return null;
  }

  const value = record[fieldMetadataItem.name];

  if (typeof value === 'string') {
    return value.length > 0 ? value : null;
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : null;
  }

  return null;
};

export const getMappedFieldDateValue = (
  record: Record<string, unknown>,
  fieldMetadataItem: FieldMetadataItem | null,
): string | null => {
  if (!isDefined(fieldMetadataItem)) {
    return null;
  }

  const value = record[fieldMetadataItem.name];

  return typeof value === 'string' && value.length > 0 ? value : null;
};
