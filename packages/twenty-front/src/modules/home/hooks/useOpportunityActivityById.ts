import { useHomePagePreferences } from '@/home/hooks/useHomePagePreferences';
import {
  type OpportunityActivityCalendarEvent,
  type OpportunityActivityDiagnostics,
  type OpportunityActivityTask,
  type OpportunityActivityTimelineActivity,
  buildOpportunityActivityById,
  buildOpportunityActivityDiagnostics,
} from '@/home/utils/buildOpportunityActivityById';
import { type OpportunityActivityById } from '@/home/utils/getOpportunitySignalState';
import {
  buildOpportunityTimelineActivityFilter,
  getTimelineActivityTargetFieldName,
} from '@/home/utils/resolveOpportunitySignalFields';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { startOfDay, subDays } from 'date-fns';
import { useMemo } from 'react';
import {
  CoreObjectNameSingular,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';

const ACTIVITY_WINDOW_MINIMUM_DAYS = 30;
const TIMELINE_ACTIVITY_LIMIT = 200;
const DEFAULT_STALE_OPPORTUNITY_DAY_LIMIT = 14;

export const getOpportunityActivityWindowDays = (staleDayLimit: number) =>
  Math.max(staleDayLimit, ACTIVITY_WINDOW_MINIMUM_DAYS);

type TimelineActivityRecord = OpportunityActivityTimelineActivity & {
  __typename: string;
};

/**
 * Loads the activity that is bound to the opportunities the dashboard shows.
 *
 * The activity timeline is filtered server side to the tracked opportunity ids,
 * so a bounded window still describes those deals completely instead of mixing
 * them with unrelated workspace activity. Notes and emails reach this hook
 * through the timeline, which is why no separate notes query is needed.
 *
 * Only the joined payload is fetched once per query: tasks and calendar events
 * come from the lists the dashboard already holds.
 */
export const useOpportunityActivityById = ({
  calendarEvents,
  opportunityIds,
  opportunityObjectNameSingular = CoreObjectNameSingular.Opportunity,
  tasks,
}: {
  calendarEvents: OpportunityActivityCalendarEvent[];
  opportunityIds: string[];
  opportunityObjectNameSingular?: string;
  tasks: OpportunityActivityTask[];
}): {
  activityById: OpportunityActivityById;
  diagnostics: OpportunityActivityDiagnostics;
} => {
  const homePagePreferences = useHomePagePreferences();
  const now = useMemo(() => new Date(), []);
  const staleDayLimit =
    homePagePreferences.staleOpportunityDayLimit ??
    DEFAULT_STALE_OPPORTUNITY_DAY_LIMIT;
  const activityWindowDays = getOpportunityActivityWindowDays(staleDayLimit);
  // Anchored to the start of the day: a boundary that moves on every render would
  // change the query variables continuously and never hit the client cache.
  const windowStartsAt = useMemo(
    () => startOfDay(subDays(now, activityWindowDays)).toISOString(),
    [activityWindowDays, now],
  );
  const targetFieldName = getTimelineActivityTargetFieldName(
    opportunityObjectNameSingular,
  );
  const isTimelineQuerySkipped = opportunityIds.length === 0;
  const filter: RecordGqlOperationFilter = useMemo(
    () =>
      buildOpportunityTimelineActivityFilter({
        opportunityIds,
        opportunityObjectNameSingular,
        windowStartsAt,
      }),
    [opportunityIds, opportunityObjectNameSingular, windowStartsAt],
  );

  const { records: timelineActivities } =
    useFindManyRecords<TimelineActivityRecord>({
      skip: isTimelineQuerySkipped,
      filter,
      limit: TIMELINE_ACTIVITY_LIMIT,
      objectNameSingular: CoreObjectNameSingular.TimelineActivity,
      orderBy: [{ happensAt: 'DescNullsFirst' }],
      recordGqlFields: {
        id: true,
        happensAt: true,
        name: true,
        timelineActivityTypeSnapshot: true,
        targetOpportunity: { id: true },
        targetOpportunityId: true,
      },
    });

  const activityById = buildOpportunityActivityById({
    calendarEvents,
    now,
    tasks,
    timelineActivities,
  });
  const diagnostics = buildOpportunityActivityDiagnostics({
    activityById,
    activityWindowDays,
    isTimelineQuerySkipped,
    opportunityIds,
    staleDayLimit,
    targetFieldName,
    timelineActivities,
    timelineActivityLimit: TIMELINE_ACTIVITY_LIMIT,
    windowStartsAt,
  });

  return { activityById, diagnostics };
};
