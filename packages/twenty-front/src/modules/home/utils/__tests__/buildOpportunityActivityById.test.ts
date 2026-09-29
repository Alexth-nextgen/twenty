import {
  buildOpportunityActivityById,
  buildOpportunityActivityDiagnostics,
} from '@/home/utils/buildOpportunityActivityById';

const NOW = new Date('2026-09-18T09:00:00.000Z');

const emptyActivity = {
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

describe('buildOpportunityActivityById', () => {
  it('maps open tasks to their targeted opportunities', () => {
    const activityById = buildOpportunityActivityById({
      calendarEvents: [],
      notes: [],
      now: NOW,
      tasks: [
        {
          dueAt: '2026-09-20T09:00:00.000Z',
          status: 'TODO',
          taskTargets: [{ targetOpportunityId: 'opportunity-1' }],
          updatedAt: '2026-09-16T09:00:00.000Z',
        },
        {
          dueAt: '2026-09-19T09:00:00.000Z',
          status: 'TODO',
          taskTargets: [{ targetOpportunity: { id: 'opportunity-1' } }],
          updatedAt: '2026-09-17T09:00:00.000Z',
        },
      ],
      timelineActivities: [],
    });

    expect(activityById['opportunity-1']).toEqual({
      ...emptyActivity,
      lastActivityAt: '2026-09-17T09:00:00.000Z',
      lastActivitySource: 'task',
      lastTaskActivityAt: '2026-09-17T09:00:00.000Z',
      nextTaskDueAt: '2026-09-19T09:00:00.000Z',
      openTaskCount: 2,
    });
  });

  it('ignores completed tasks and tasks without an opportunity target', () => {
    const activityById = buildOpportunityActivityById({
      calendarEvents: [],
      notes: [],
      now: NOW,
      tasks: [
        {
          dueAt: '2026-09-20T09:00:00.000Z',
          status: 'DONE',
          taskTargets: [{ targetOpportunityId: 'opportunity-1' }],
          updatedAt: '2026-09-17T09:00:00.000Z',
        },
        {
          dueAt: '2026-09-20T09:00:00.000Z',
          status: 'TODO',
          taskTargets: [],
          updatedAt: '2026-09-17T09:00:00.000Z',
        },
      ],
      timelineActivities: [],
    });

    expect(activityById).toEqual({});
  });

  it('splits calendar events into last and next meeting', () => {
    const activityById = buildOpportunityActivityById({
      calendarEvents: [
        {
          calendarEventTargets: [{ targetOpportunityId: 'opportunity-1' }],
          isCanceled: false,
          startsAt: '2026-09-17T09:00:00.000Z',
        },
        {
          calendarEventTargets: [
            { targetOpportunity: { id: 'opportunity-1' } },
          ],
          isCanceled: false,
          startsAt: '2026-09-21T09:00:00.000Z',
        },
        {
          calendarEventTargets: [{ targetOpportunityId: 'opportunity-1' }],
          isCanceled: true,
          startsAt: '2026-09-19T09:00:00.000Z',
        },
      ],
      notes: [],
      now: NOW,
      tasks: [],
      timelineActivities: [],
    });

    expect(activityById['opportunity-1']).toEqual({
      ...emptyActivity,
      lastActivityAt: '2026-09-17T09:00:00.000Z',
      lastActivitySource: 'meeting',
      lastMeetingStartsAt: '2026-09-17T09:00:00.000Z',
      nextMeetingStartsAt: '2026-09-21T09:00:00.000Z',
    });
  });

  it('maps notes to their targeted opportunities', () => {
    const activityById = buildOpportunityActivityById({
      calendarEvents: [],
      notes: [
        {
          createdAt: '2026-09-10T09:00:00.000Z',
          id: 'note-1',
          noteTargets: [{ targetOpportunityId: 'opportunity-1' }],
          updatedAt: '2026-09-12T09:00:00.000Z',
        },
      ],
      now: NOW,
      tasks: [],
      timelineActivities: [],
    });

    expect(activityById['opportunity-1']).toEqual({
      ...emptyActivity,
      lastActivityAt: '2026-09-12T09:00:00.000Z',
      lastActivitySource: 'note',
      lastNoteAt: '2026-09-12T09:00:00.000Z',
    });
  });

  it('classifies timeline activities and keeps the latest one as last activity', () => {
    const activityById = buildOpportunityActivityById({
      calendarEvents: [],
      notes: [],
      now: NOW,
      tasks: [],
      timelineActivities: [
        {
          happensAt: '2026-09-06T09:00:00.000Z',
          id: 'timeline-1',
          targetOpportunityId: 'opportunity-1',
          timelineActivityTypeSnapshot: { name: 'note.created' },
        },
        {
          happensAt: '2026-09-15T09:00:00.000Z',
          id: 'timeline-2',
          targetOpportunity: { id: 'opportunity-1' },
          timelineActivityTypeSnapshot: { name: 'message.received' },
        },
        {
          happensAt: '2026-09-16T09:00:00.000Z',
          id: 'timeline-3',
          targetOpportunityId: 'opportunity-1',
          timelineActivityTypeSnapshot: { name: 'opportunity.stageUpdated' },
        },
      ],
    });

    expect(activityById['opportunity-1']).toEqual({
      ...emptyActivity,
      lastActivityAt: '2026-09-16T09:00:00.000Z',
      lastActivitySource: 'timelineActivity',
      lastEmailAt: '2026-09-15T09:00:00.000Z',
      lastNoteAt: '2026-09-06T09:00:00.000Z',
    });
  });

  it('falls back to the timeline activity name when no snapshot is available', () => {
    const activityById = buildOpportunityActivityById({
      calendarEvents: [],
      notes: [],
      now: NOW,
      tasks: [],
      timelineActivities: [
        {
          happensAt: '2026-09-15T09:00:00.000Z',
          id: 'timeline-1',
          name: 'message.received',
          targetOpportunityId: 'opportunity-1',
        },
      ],
    });

    expect(activityById['opportunity-1']?.lastActivitySource).toBe('email');
    expect(activityById['opportunity-1']?.lastEmailAt).toBe(
      '2026-09-15T09:00:00.000Z',
    );
  });
});

describe('buildOpportunityActivityDiagnostics', () => {
  const timelineActivities = [
    {
      happensAt: '2026-09-15T09:00:00.000Z',
      id: 'timeline-1',
      targetOpportunityId: 'opportunity-1',
      timelineActivityTypeSnapshot: { name: 'message.received' },
    },
    {
      happensAt: '2026-09-06T09:00:00.000Z',
      id: 'timeline-2',
      targetOpportunityId: 'opportunity-1',
      timelineActivityTypeSnapshot: { name: 'note.created' },
    },
    {
      happensAt: '2026-09-12T09:00:00.000Z',
      id: 'timeline-3',
      targetOpportunityId: 'opportunity-2',
      timelineActivityTypeSnapshot: { name: 'note.created' },
    },
    {
      happensAt: '2026-09-16T09:00:00.000Z',
      id: 'timeline-4',
      timelineActivityTypeSnapshot: { name: 'opportunity.created' },
    },
  ];

  const buildDiagnostics = (
    overrides: Partial<
      Parameters<typeof buildOpportunityActivityDiagnostics>[0]
    >,
  ) =>
    buildOpportunityActivityDiagnostics({
      activityById: buildOpportunityActivityById({
        calendarEvents: [],
        now: NOW,
        tasks: [],
        timelineActivities,
      }),
      activityWindowDays: 30,
      isTimelineQuerySkipped: false,
      opportunityIds: ['opportunity-1', 'opportunity-2', 'opportunity-3'],
      staleDayLimit: 14,
      targetFieldName: 'targetOpportunityId',
      timelineActivities,
      timelineActivityLimit: 200,
      windowStartsAt: '2026-08-19T00:00:00.000Z',
      ...overrides,
    });

  it('counts the loaded timeline per source and keeps the latest entry', () => {
    const diagnostics = buildDiagnostics({});

    expect(diagnostics.timelineSourceSummaries).toEqual({
      email: { count: 1, latestAt: '2026-09-15T09:00:00.000Z' },
      note: { count: 2, latestAt: '2026-09-12T09:00:00.000Z' },
      timelineActivity: { count: 1, latestAt: '2026-09-16T09:00:00.000Z' },
    });
  });

  it('reports coverage against the tracked opportunities', () => {
    const diagnostics = buildDiagnostics({});

    expect(diagnostics.opportunitiesTrackedCount).toBe(3);
    expect(diagnostics.opportunitiesWithRecordedActivityCount).toBe(2);
  });

  it('treats an upcoming meeting without recorded activity as uncovered', () => {
    const activityById = buildOpportunityActivityById({
      calendarEvents: [
        {
          calendarEventTargets: [{ targetOpportunityId: 'opportunity-3' }],
          isCanceled: false,
          startsAt: '2026-09-25T09:00:00.000Z',
        },
      ],
      now: NOW,
      tasks: [],
      timelineActivities: [],
    });
    const diagnostics = buildDiagnostics({ activityById });

    expect(diagnostics.opportunitiesWithRecordedActivityCount).toBe(0);
  });

  it('makes unlinked timeline entries and truncation visible', () => {
    const diagnostics = buildDiagnostics({ timelineActivityLimit: 4 });

    expect(diagnostics.unlinkedTimelineActivityCount).toBe(1);
    expect(diagnostics.isTimelineTruncated).toBe(true);
  });

  it('reports a skipped timeline query instead of an empty result', () => {
    const diagnostics = buildDiagnostics({
      activityById: {},
      isTimelineQuerySkipped: true,
      opportunityIds: [],
      timelineActivities: [],
    });

    expect(diagnostics.isTimelineQuerySkipped).toBe(true);
    expect(diagnostics.opportunitiesTrackedCount).toBe(0);
    expect(diagnostics.isTimelineTruncated).toBe(false);
  });
});
