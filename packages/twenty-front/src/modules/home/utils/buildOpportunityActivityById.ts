import {
  type OpportunityActivity,
  type OpportunityActivityById,
  type OpportunityActivitySource,
  getEarliestIsoDate,
  getLatestIsoDate,
} from '@/home/utils/getOpportunitySignalState';
import { isDefined } from 'twenty-shared/utils';

export type OpportunityActivityTarget = {
  targetOpportunity?: { id: string } | null;
  targetOpportunityId?: string | null;
};

export type OpportunityActivityTask = {
  dueAt: string | null;
  status: string | null;
  taskTargets?: OpportunityActivityTarget[] | null;
  updatedAt: string;
};

export type OpportunityActivityCalendarEvent = {
  calendarEventTargets?: OpportunityActivityTarget[] | null;
  isCanceled: boolean;
  startsAt: string | null;
};

export type OpportunityActivityNote = {
  createdAt: string;
  id: string;
  noteTargets?: OpportunityActivityTarget[] | null;
  updatedAt: string;
};

export type OpportunityActivityTimelineActivity = {
  happensAt: string;
  id: string;
  name?: string | null;
  targetOpportunity?: { id: string } | null;
  targetOpportunityId?: string | null;
  timelineActivityTypeSnapshot?: {
    action?: string | null;
    name?: string | null;
  } | null;
};

/**
 * Morph relation join columns are exposed either as the join column itself or as
 * the related record identifier, depending on the workspace schema. Both shapes
 * are accepted so a missing shape degrades to "no linked activity" instead of an
 * invalid query.
 */
export const getTargetOpportunityId = (
  target: OpportunityActivityTarget,
): string | null =>
  isDefined(target.targetOpportunityId) && target.targetOpportunityId.length > 0
    ? target.targetOpportunityId
    : (target.targetOpportunity?.id ?? null);

const getTargetOpportunityIds = (
  targets: OpportunityActivityTarget[] | null | undefined,
): string[] =>
  (targets ?? [])
    .map((target) => getTargetOpportunityId(target))
    .filter((targetOpportunityId): targetOpportunityId is string =>
      isDefined(targetOpportunityId),
    );

export const getTimelineActivitySource = (
  timelineActivity: OpportunityActivityTimelineActivity,
): OpportunityActivitySource => {
  const typeName = (
    timelineActivity.timelineActivityTypeSnapshot?.name ??
    timelineActivity.name ??
    ''
  ).toLocaleLowerCase();
  const objectName = typeName.split('.')[0] ?? '';

  if (objectName.includes('note')) {
    return 'note';
  }

  if (objectName.includes('message') || objectName.includes('email')) {
    return 'email';
  }

  if (objectName.includes('task')) {
    return 'task';
  }

  if (objectName.includes('calendar')) {
    return 'meeting';
  }

  return 'timelineActivity';
};

/**
 * Derives per-opportunity activity from the records that already carry an
 * opportunity target: open tasks, calendar events, notes and the activity
 * timeline (which records notes, emails and other record events). Tasks are
 * expected to be open tasks only, therefore `lastTaskActivityAt` reflects open
 * work rather than completed work.
 *
 * `notes` is optional because the standard workspace already reports note events
 * through the activity timeline. A workspace (or CRM) that exposes note targets
 * directly can pass them in without changing the signal logic.
 */
export const buildOpportunityActivityById = ({
  calendarEvents,
  notes = [],
  now,
  tasks,
  timelineActivities,
}: {
  calendarEvents: OpportunityActivityCalendarEvent[];
  notes?: OpportunityActivityNote[];
  now: Date;
  tasks: OpportunityActivityTask[];
  timelineActivities: OpportunityActivityTimelineActivity[];
}): OpportunityActivityById => {
  const activityById: OpportunityActivityById = {};

  const getOrCreateActivity = (opportunityId: string): OpportunityActivity => {
    const existingActivity = activityById[opportunityId];

    if (isDefined(existingActivity)) {
      return existingActivity;
    }

    const newActivity: OpportunityActivity = {
      lastActivityAt: null,
      lastActivitySource: null,
      lastEmailAt: null,
      lastMeetingStartsAt: null,
      lastNoteAt: null,
      lastTaskActivityAt: null,
      nextMeetingStartsAt: null,
      nextTaskDueAt: null,
      openTaskCount: 0,
    };

    activityById[opportunityId] = newActivity;

    return newActivity;
  };

  const applyActivity = (
    activity: OpportunityActivity,
    isoDate: string,
    source: OpportunityActivitySource,
  ) => {
    const isNewer =
      !isDefined(activity.lastActivityAt) ||
      new Date(isoDate).getTime() > new Date(activity.lastActivityAt).getTime();

    if (isNewer) {
      activity.lastActivityAt = isoDate;
      activity.lastActivitySource = source;
    }
  };

  for (const task of tasks) {
    if (task.status === 'DONE') {
      continue;
    }

    for (const opportunityId of getTargetOpportunityIds(task.taskTargets)) {
      const activity = getOrCreateActivity(opportunityId);

      activity.openTaskCount += 1;
      activity.lastTaskActivityAt = getLatestIsoDate(
        activity.lastTaskActivityAt,
        task.updatedAt,
      );
      activity.nextTaskDueAt = getEarliestIsoDate(
        activity.nextTaskDueAt,
        task.dueAt,
      );
      applyActivity(activity, task.updatedAt, 'task');
    }
  }

  for (const note of notes) {
    const noteAt = getLatestIsoDate(note.createdAt, note.updatedAt);

    if (!isDefined(noteAt)) {
      continue;
    }

    for (const opportunityId of getTargetOpportunityIds(note.noteTargets)) {
      const activity = getOrCreateActivity(opportunityId);

      activity.lastNoteAt = getLatestIsoDate(activity.lastNoteAt, noteAt);
      applyActivity(activity, noteAt, 'note');
    }
  }

  for (const timelineActivity of timelineActivities) {
    const opportunityId = getTargetOpportunityId(timelineActivity);

    if (!isDefined(opportunityId)) {
      continue;
    }

    const activity = getOrCreateActivity(opportunityId);
    const source = getTimelineActivitySource(timelineActivity);

    if (source === 'note') {
      activity.lastNoteAt = getLatestIsoDate(
        activity.lastNoteAt,
        timelineActivity.happensAt,
      );
    }

    if (source === 'email') {
      activity.lastEmailAt = getLatestIsoDate(
        activity.lastEmailAt,
        timelineActivity.happensAt,
      );
    }

    applyActivity(activity, timelineActivity.happensAt, source);
  }

  for (const calendarEvent of calendarEvents) {
    if (calendarEvent.isCanceled || !isDefined(calendarEvent.startsAt)) {
      continue;
    }

    const startsAt = calendarEvent.startsAt;
    const isUpcoming = new Date(startsAt).getTime() >= now.getTime();

    for (const opportunityId of getTargetOpportunityIds(
      calendarEvent.calendarEventTargets,
    )) {
      const activity = getOrCreateActivity(opportunityId);

      if (isUpcoming) {
        activity.nextMeetingStartsAt = getEarliestIsoDate(
          activity.nextMeetingStartsAt,
          startsAt,
        );
      } else {
        activity.lastMeetingStartsAt = getLatestIsoDate(
          activity.lastMeetingStartsAt,
          startsAt,
        );
        applyActivity(activity, startsAt, 'meeting');
      }
    }
  }

  return activityById;
};

export type OpportunityActivitySourceSummary = {
  count: number;
  latestAt: string;
};

/**
 * Everything the dashboard can say about its own data basis. The numbers are
 * observations about the loaded payload, not estimates: they make a filter that
 * matches nothing, a truncated list or a missing relation visible instead of
 * silently turning into "this deal has no activity".
 */
export type OpportunityActivityDiagnostics = {
  activityWindowDays: number;
  isTimelineQuerySkipped: boolean;
  isTimelineTruncated: boolean;
  opportunitiesTrackedCount: number;
  opportunitiesWithRecordedActivityCount: number;
  staleDayLimit: number;
  targetFieldName: string;
  timelineActivityLimit: number;
  timelineSourceSummaries: Partial<
    Record<OpportunityActivitySource, OpportunityActivitySourceSummary>
  >;
  unlinkedTimelineActivityCount: number;
  windowStartsAt: string;
};

export const buildOpportunityActivityDiagnostics = ({
  activityById,
  activityWindowDays,
  isTimelineQuerySkipped,
  opportunityIds,
  staleDayLimit,
  targetFieldName,
  timelineActivities,
  timelineActivityLimit,
  windowStartsAt,
}: {
  activityById: OpportunityActivityById;
  activityWindowDays: number;
  isTimelineQuerySkipped: boolean;
  opportunityIds: string[];
  staleDayLimit: number;
  targetFieldName: string;
  timelineActivities: OpportunityActivityTimelineActivity[];
  timelineActivityLimit: number;
  windowStartsAt: string;
}): OpportunityActivityDiagnostics => {
  const timelineSourceSummaries: Partial<
    Record<OpportunityActivitySource, OpportunityActivitySourceSummary>
  > = {};
  let linkedTimelineActivityCount = 0;

  for (const timelineActivity of timelineActivities) {
    if (isDefined(getTargetOpportunityId(timelineActivity))) {
      linkedTimelineActivityCount += 1;
    }

    const source = getTimelineActivitySource(timelineActivity);
    const { happensAt } = timelineActivity;
    const existingSummary = timelineSourceSummaries[source];

    timelineSourceSummaries[source] = isDefined(existingSummary)
      ? {
          count: existingSummary.count + 1,
          latestAt:
            getLatestIsoDate(existingSummary.latestAt, happensAt) ??
            existingSummary.latestAt,
        }
      : { count: 1, latestAt: happensAt };
  }

  return {
    activityWindowDays,
    isTimelineQuerySkipped,
    isTimelineTruncated: timelineActivities.length >= timelineActivityLimit,
    opportunitiesTrackedCount: opportunityIds.length,
    opportunitiesWithRecordedActivityCount: opportunityIds.filter(
      (opportunityId) => isDefined(activityById[opportunityId]?.lastActivityAt),
    ).length,
    staleDayLimit,
    targetFieldName,
    timelineActivityLimit,
    timelineSourceSummaries,
    unlinkedTimelineActivityCount:
      timelineActivities.length - linkedTimelineActivityCount,
    windowStartsAt,
  };
};
