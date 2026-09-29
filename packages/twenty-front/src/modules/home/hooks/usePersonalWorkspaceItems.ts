import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useHomePagePreferences } from '@/home/hooks/useHomePagePreferences';
import {
  type OpportunityActivityCalendarEvent,
  type OpportunityActivityTask,
} from '@/home/utils/buildOpportunityActivityById';
import { resolveOpportunitySignalFields } from '@/home/utils/resolveOpportunitySignalFields';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import {
  CoreObjectNameSingular,
  MessageCampaignStatus,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const PERSONAL_TASK_LIMIT = 30;
export const CALENDAR_EVENT_LIMIT = 250;
const FAILED_WORKFLOW_RUN_LIMIT = 20;
export const TEAM_TASK_LIMIT = 100;
export const MESSAGE_CAMPAIGN_LIMIT = 50;
const TEAM_MEMBER_LIMIT = 100;
export const OPPORTUNITY_LIMIT = 200;

export type PersonalTask = ObjectRecord & {
  id: string;
  title: string;
  dueAt: string | null;
  status: string | null;
  updatedAt: string;
};

type CalendarEventParticipant = {
  workspaceMemberId: string | null;
};

export type PersonalCalendarEvent = ObjectRecord &
  OpportunityActivityCalendarEvent & {
    id: string;
    title: string | null;
    startsAt: string | null;
    endsAt: string | null;
    isFullDay: boolean;
    isCanceled: boolean;
    calendarEventParticipants: CalendarEventParticipant[];
  };

export type FailedWorkflowRun = ObjectRecord & {
  id: string;
  name: string | null;
  endedAt: string | null;
  status: string;
};

type TaskAssignee = {
  id: string;
  avatarUrl: string | null;
  name: {
    firstName: string;
    lastName: string;
  };
};

export type TeamTask = PersonalTask &
  Pick<OpportunityActivityTask, 'taskTargets'> & {
    assignee: TaskAssignee | null;
    assigneeId: string | null;
  };

export type MessageCampaign = ObjectRecord & {
  id: string;
  name: string;
  status: MessageCampaignStatus;
  sentAt: string | null;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  bouncedCount: number;
  complainedCount: number;
  skippedCount: number;
};

export type WorkspaceMemberSummary = ObjectRecord & {
  id: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  name: {
    firstName: string;
    lastName: string;
  };
};

export type TeamOpportunity = ObjectRecord & {
  id: string;
  name: string | null;
  amount: {
    amountMicros: number | null;
    currencyCode: string | null;
  } | null;
  closeDate: string | null;
  ownerId: string | null;
  stage: string;
  updatedAt: string;
};

export const usePersonalWorkspaceItems = () => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const homePagePreferences = useHomePagePreferences();
  const objectMetadataItems = useAtomStateValue(objectMetadataItemsSelector);
  const opportunityObjectMetadataItem = objectMetadataItems.find(
    (objectMetadataItem) =>
      objectMetadataItem.nameSingular === CoreObjectNameSingular.Opportunity,
  );
  const signalFieldSettings = homePagePreferences.signalFieldSettings;
  const opportunitySignalFields = resolveOpportunitySignalFields({
    objectMetadataItem: opportunityObjectMetadataItem,
    settings:
      isDefined(signalFieldSettings) &&
      signalFieldSettings.objectMetadataId === opportunityObjectMetadataItem?.id
        ? signalFieldSettings
        : undefined,
  });
  const mappedSignalRecordGqlFields = {
    ...(isDefined(opportunitySignalFields.lastActivityField)
      ? { [opportunitySignalFields.lastActivityField.name]: true }
      : {}),
    ...(isDefined(opportunitySignalFields.nextStepDateField)
      ? { [opportunitySignalFields.nextStepDateField.name]: true }
      : {}),
    ...(isDefined(opportunitySignalFields.nextStepField)
      ? { [opportunitySignalFields.nextStepField.name]: true }
      : {}),
  };
  const today = new Date();
  const todayStartsAt = startOfDay(today).toISOString();
  const todayEndsAt = endOfDay(today).toISOString();
  const weekStartsAt = startOfWeek(today, { weekStartsOn: 1 }).toISOString();
  const weekEndsAt = endOfWeek(today, { weekStartsOn: 1 }).toISOString();
  const previousWeekStartsAt = startOfWeek(subWeeks(today, 1), {
    weekStartsOn: 1,
  }).toISOString();
  const previousWeekEndsAt = endOfWeek(subWeeks(today, 1), {
    weekStartsOn: 1,
  }).toISOString();
  const monthStartsAt = startOfMonth(today).toISOString();
  const monthEndsAt = endOfMonth(today).toISOString();
  const previousMonthStartsAt = startOfMonth(subMonths(today, 1)).toISOString();
  const previousMonthEndsAt = endOfMonth(subMonths(today, 1)).toISOString();

  const { records: tasks, loading: areTasksLoading } =
    useFindManyRecords<PersonalTask>({
      objectNameSingular: CoreObjectNameSingular.Task,
      filter: isDefined(currentWorkspaceMember)
        ? {
            assigneeId: { eq: currentWorkspaceMember.id },
            status: { neq: 'DONE' },
          }
        : undefined,
      orderBy: [{ dueAt: 'AscNullsLast' }],
      recordGqlFields: {
        id: true,
        title: true,
        dueAt: true,
        status: true,
      },
      limit: PERSONAL_TASK_LIMIT,
      skip: !isDefined(currentWorkspaceMember),
    });

  const { records: calendarEvents, loading: areCalendarEventsLoading } =
    useFindManyRecords<PersonalCalendarEvent>({
      objectNameSingular: CoreObjectNameSingular.CalendarEvent,
      filter: {
        and: [
          { startsAt: { gte: previousMonthStartsAt } },
          { startsAt: { lte: monthEndsAt } },
        ],
        isCanceled: { eq: false },
      },
      orderBy: [{ startsAt: 'AscNullsLast' }],
      recordGqlFields: {
        id: true,
        title: true,
        startsAt: true,
        endsAt: true,
        isFullDay: true,
        isCanceled: true,
        calendarEventParticipants: {
          workspaceMemberId: true,
        },
        calendarEventTargets: {
          targetOpportunity: { id: true },
          targetOpportunityId: true,
        },
      },
      limit: CALENDAR_EVENT_LIMIT,
      skip: !isDefined(currentWorkspaceMember),
    });

  const { records: failedWorkflowRuns, loading: areWorkflowRunsLoading } =
    useFindManyRecords<FailedWorkflowRun>({
      objectNameSingular: CoreObjectNameSingular.WorkflowRun,
      filter: { status: { eq: 'FAILED' } },
      orderBy: [{ endedAt: 'DescNullsLast' }],
      recordGqlFields: {
        id: true,
        name: true,
        endedAt: true,
        status: true,
      },
      limit: FAILED_WORKFLOW_RUN_LIMIT,
    });

  const { records: teamTasks, loading: areTeamTasksLoading } =
    useFindManyRecords<TeamTask>({
      objectNameSingular: CoreObjectNameSingular.Task,
      filter: { status: { neq: 'DONE' } },
      orderBy: [{ dueAt: 'AscNullsLast' }],
      recordGqlFields: {
        id: true,
        title: true,
        dueAt: true,
        status: true,
        assigneeId: true,
        assignee: {
          id: true,
          avatarUrl: true,
          name: { firstName: true, lastName: true },
        },
        taskTargets: {
          targetOpportunity: { id: true },
          targetOpportunityId: true,
        },
      },
      limit: TEAM_TASK_LIMIT,
    });

  const { records: messageCampaigns, loading: areMessageCampaignsLoading } =
    useFindManyRecords<MessageCampaign>({
      objectNameSingular: CoreObjectNameSingular.MessageCampaign,
      filter: {
        status: {
          in: [
            MessageCampaignStatus.SCHEDULED,
            MessageCampaignStatus.SENDING,
            MessageCampaignStatus.SENT,
            MessageCampaignStatus.SENT_WITH_ERRORS,
          ],
        },
      },
      orderBy: [{ createdAt: 'DescNullsLast' }],
      recordGqlFields: {
        id: true,
        name: true,
        status: true,
        sentAt: true,
        sentCount: true,
        deliveredCount: true,
        failedCount: true,
        bouncedCount: true,
        complainedCount: true,
        skippedCount: true,
      },
      limit: MESSAGE_CAMPAIGN_LIMIT,
    });

  const { records: workspaceMembers, loading: areWorkspaceMembersLoading } =
    useFindManyRecords<WorkspaceMemberSummary>({
      objectNameSingular: CoreObjectNameSingular.WorkspaceMember,
      orderBy: [{ name: { firstName: 'AscNullsLast' } }],
      recordGqlFields: {
        id: true,
        avatarUrl: true,
        jobTitle: true,
        name: { firstName: true, lastName: true },
      },
      limit: TEAM_MEMBER_LIMIT,
    });

  const { records: opportunities, loading: areOpportunitiesLoading } =
    useFindManyRecords<TeamOpportunity>({
      objectNameSingular: CoreObjectNameSingular.Opportunity,
      filter: { stage: { neq: 'CUSTOMER' } },
      orderBy: [{ updatedAt: 'DescNullsLast' }],
      recordGqlFields: {
        id: true,
        name: true,
        amount: { amountMicros: true, currencyCode: true },
        closeDate: true,
        ownerId: true,
        stage: true,
        updatedAt: true,
        ...mappedSignalRecordGqlFields,
      },
      limit: OPPORTUNITY_LIMIT,
    });

  const personalCalendarEvents = calendarEvents.filter((calendarEvent) =>
    calendarEvent.calendarEventParticipants.some(
      (participant) =>
        participant.workspaceMemberId === currentWorkspaceMember?.id,
    ),
  );
  const meetings = personalCalendarEvents.filter(
    (calendarEvent) =>
      isDefined(calendarEvent.startsAt) &&
      calendarEvent.startsAt >= todayStartsAt &&
      calendarEvent.startsAt <= todayEndsAt,
  );
  const weekMeetings = personalCalendarEvents.filter(
    (calendarEvent) =>
      isDefined(calendarEvent.startsAt) &&
      calendarEvent.startsAt >= weekStartsAt &&
      calendarEvent.startsAt <= weekEndsAt,
  );
  const previousWeekMeetings = personalCalendarEvents.filter(
    (calendarEvent) =>
      isDefined(calendarEvent.startsAt) &&
      calendarEvent.startsAt >= previousWeekStartsAt &&
      calendarEvent.startsAt <= previousWeekEndsAt,
  );
  const monthMeetings = personalCalendarEvents.filter(
    (calendarEvent) =>
      isDefined(calendarEvent.startsAt) &&
      calendarEvent.startsAt >= monthStartsAt &&
      calendarEvent.startsAt <= monthEndsAt,
  );
  const previousMonthMeetings = personalCalendarEvents.filter(
    (calendarEvent) =>
      isDefined(calendarEvent.startsAt) &&
      calendarEvent.startsAt >= previousMonthStartsAt &&
      calendarEvent.startsAt <= previousMonthEndsAt,
  );
  const managementMeetings = weekMeetings.filter((calendarEvent) =>
    calendarEvent.title?.toLocaleLowerCase().includes('management'),
  );
  const advisorMeetings = weekMeetings.filter((calendarEvent) => {
    const normalizedTitle = calendarEvent.title?.toLocaleLowerCase() ?? '';

    return (
      normalizedTitle.includes('advisor') || normalizedTitle.includes('berater')
    );
  });

  const overdueTasks = tasks.filter(
    (task) => isDefined(task.dueAt) && new Date(task.dueAt) < today,
  );
  const upcomingTasks = tasks.filter(
    (task) => !isDefined(task.dueAt) || new Date(task.dueAt) >= today,
  );

  const isCalendarEventListTruncated =
    calendarEvents.length >= CALENDAR_EVENT_LIMIT;
  const isMessageCampaignListTruncated =
    messageCampaigns.length >= MESSAGE_CAMPAIGN_LIMIT;
  const isOpportunityListTruncated = opportunities.length >= OPPORTUNITY_LIMIT;
  const isPersonalTaskListTruncated = tasks.length >= PERSONAL_TASK_LIMIT;
  const isTeamTaskListTruncated = teamTasks.length >= TEAM_TASK_LIMIT;

  return {
    areCalendarEventsLoading,
    areTasksLoading,
    isCalendarEventListTruncated,
    isMessageCampaignListTruncated,
    isOpportunityListTruncated,
    isPersonalTaskListTruncated,
    isTeamTaskListTruncated,
    opportunityObjectMetadataItem,
    opportunitySignalFields,
    areTeamTasksLoading,
    areMessageCampaignsLoading,
    areOpportunitiesLoading,
    areWorkflowRunsLoading,
    areWorkspaceMembersLoading,
    calendarEvents,
    failedWorkflowRuns,
    meetings,
    monthMeetings,
    previousMonthMeetings,
    previousWeekMeetings,
    weekMeetings,
    managementMeetings,
    advisorMeetings,
    messageCampaigns,
    opportunities,
    overdueTasks,
    tasks,
    teamTasks,
    upcomingTasks,
    workspaceMembers,
  };
};
