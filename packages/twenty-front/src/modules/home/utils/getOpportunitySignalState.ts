import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export type OpportunityActivitySource =
  | 'email'
  | 'mappedField'
  | 'meeting'
  | 'note'
  | 'task'
  | 'timelineActivity';

export type OpportunityActivity = {
  lastActivityAt: string | null;
  lastActivitySource: OpportunityActivitySource | null;
  lastEmailAt: string | null;
  lastMeetingStartsAt: string | null;
  lastNoteAt: string | null;
  lastTaskActivityAt: string | null;
  nextMeetingStartsAt: string | null;
  nextTaskDueAt: string | null;
  openTaskCount: number;
};

export type OpportunityActivityById = Record<string, OpportunityActivity>;

export type OpportunitySignalReason =
  | 'closeDatePassed'
  | 'noLinkedNextStep'
  | 'nextStepMissing'
  | 'nextStepOverdue'
  | 'stalled';

export type OpportunitySignalState = {
  activity: OpportunityActivity;
  daysSinceLastActivity: number | null;
  daysSinceUpdate: number;
  hasNextStep: boolean;
  isNextStepOverdue: boolean;
  isStale: boolean;
  lastActivityAt: string | null;
  lastActivitySource: OpportunityActivitySource | null;
  reasons: OpportunitySignalReason[];
};

export const getLatestIsoDate = (
  ...isoDates: Array<string | null | undefined>
): string | null =>
  isoDates
    .filter(isNonEmptyString)
    .reduce<string | null>(
      (latest, isoDate) =>
        !isDefined(latest) ||
        new Date(isoDate).getTime() > new Date(latest).getTime()
          ? isoDate
          : latest,
      null,
    );

export const getEarliestIsoDate = (
  ...isoDates: Array<string | null | undefined>
): string | null =>
  isoDates
    .filter(isNonEmptyString)
    .reduce<string | null>(
      (earliest, isoDate) =>
        !isDefined(earliest) ||
        new Date(isoDate).getTime() < new Date(earliest).getTime()
          ? isoDate
          : earliest,
      null,
    );

export const getDaysSinceIsoDate = (isoDate: string, now: Date): number =>
  Math.floor(
    (now.getTime() - new Date(isoDate).getTime()) / MILLISECONDS_PER_DAY,
  );

export const getOpportunitySignalState = ({
  activity,
  closeDate,
  isNextStepFieldConfigured,
  mappedLastActivity,
  nextStepFieldValue,
  nextStepMappedDate,
  now,
  staleDayLimit,
  updatedAt,
}: {
  activity: OpportunityActivity | undefined;
  closeDate: string | null;
  isNextStepFieldConfigured: boolean;
  mappedLastActivity: string | null;
  nextStepFieldValue: string | null;
  nextStepMappedDate: string | null;
  now: Date;
  staleDayLimit: number;
  updatedAt: string;
}): OpportunitySignalState => {
  const opportunityActivity: OpportunityActivity = activity ?? {
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

  // A record update alone is not activity: workflows and imports touch updatedAt.
  // Real activity comes from notes, emails, tasks and meetings.
  const lastActivityAt = getLatestIsoDate(
    opportunityActivity.lastActivityAt,
    mappedLastActivity,
  );
  const lastActivitySource = !isDefined(lastActivityAt)
    ? null
    : isNonEmptyString(mappedLastActivity) &&
        new Date(mappedLastActivity).getTime() ===
          new Date(lastActivityAt).getTime()
      ? 'mappedField'
      : opportunityActivity.lastActivitySource;
  const daysSinceLastActivity = isDefined(lastActivityAt)
    ? getDaysSinceIsoDate(lastActivityAt, now)
    : null;
  const daysSinceUpdate = getDaysSinceIsoDate(updatedAt, now);
  const daysForStaleness = daysSinceLastActivity ?? daysSinceUpdate;
  const isStale = daysForStaleness >= staleDayLimit;

  const hasLinkedTask = opportunityActivity.openTaskCount > 0;
  const hasUpcomingMeeting = isNonEmptyString(
    opportunityActivity.nextMeetingStartsAt,
  );
  const hasNextStep = isNextStepFieldConfigured
    ? isNonEmptyString(nextStepFieldValue)
    : hasLinkedTask || hasUpcomingMeeting;
  const nextStepDate = isNextStepFieldConfigured
    ? nextStepMappedDate
    : opportunityActivity.nextTaskDueAt;
  const isNextStepOverdue =
    hasNextStep &&
    isNonEmptyString(nextStepDate) &&
    new Date(nextStepDate).getTime() < now.getTime();
  const isCloseDatePassed =
    isNonEmptyString(closeDate) &&
    new Date(closeDate).getTime() < now.getTime();

  const reasons: OpportunitySignalReason[] = [];

  if (isCloseDatePassed) {
    reasons.push('closeDatePassed');
  }

  if (isNextStepOverdue) {
    reasons.push('nextStepOverdue');
  }

  if (!hasNextStep) {
    reasons.push(
      isNextStepFieldConfigured ? 'nextStepMissing' : 'noLinkedNextStep',
    );
  }

  if (isStale) {
    reasons.push('stalled');
  }

  return {
    activity: opportunityActivity,
    daysSinceLastActivity,
    daysSinceUpdate,
    hasNextStep,
    isNextStepOverdue,
    isStale,
    lastActivityAt,
    lastActivitySource,
    reasons,
  };
};
