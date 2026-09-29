import {
  type OpportunityActivity,
  getOpportunitySignalState,
} from '@/home/utils/getOpportunitySignalState';

const NOW = new Date('2026-09-18T09:00:00.000Z');

const getState = (
  overrides: Partial<Parameters<typeof getOpportunitySignalState>[0]> = {},
) =>
  getOpportunitySignalState({
    activity: undefined,
    closeDate: null,
    isNextStepFieldConfigured: false,
    mappedLastActivity: null,
    nextStepFieldValue: null,
    nextStepMappedDate: null,
    now: NOW,
    staleDayLimit: 14,
    updatedAt: '2026-09-17T09:00:00.000Z',
    ...overrides,
  });

const getActivity = (
  overrides: Partial<OpportunityActivity> = {},
): OpportunityActivity => ({
  lastActivityAt: '2026-09-16T09:00:00.000Z',
  lastActivitySource: 'note',
  lastEmailAt: null,
  lastMeetingStartsAt: null,
  lastNoteAt: '2026-09-16T09:00:00.000Z',
  lastTaskActivityAt: null,
  nextMeetingStartsAt: null,
  nextTaskDueAt: null,
  openTaskCount: 0,
  ...overrides,
});

describe('getOpportunitySignalState', () => {
  it('reports no linked next step when nothing is linked and no field is mapped', () => {
    const state = getState();

    expect(state.hasNextStep).toBe(false);
    expect(state.reasons).toEqual(['noLinkedNextStep']);
  });

  it('treats a linked open task as the next step', () => {
    const state = getState({
      activity: getActivity({ openTaskCount: 1 }),
    });

    expect(state.hasNextStep).toBe(true);
    expect(state.reasons).toEqual([]);
  });

  it('treats an upcoming meeting as the next step', () => {
    const state = getState({
      activity: getActivity({
        nextMeetingStartsAt: '2026-09-20T09:00:00.000Z',
      }),
    });

    expect(state.hasNextStep).toBe(true);
    expect(state.reasons).toEqual([]);
  });

  it('flags an overdue linked task as next step overdue', () => {
    const state = getState({
      activity: getActivity({
        nextTaskDueAt: '2026-09-15T09:00:00.000Z',
        openTaskCount: 1,
      }),
    });

    expect(state.isNextStepOverdue).toBe(true);
    expect(state.reasons).toEqual(['nextStepOverdue']);
  });

  it('flags an empty mapped next step field', () => {
    const state = getState({
      activity: getActivity({ openTaskCount: 3 }),
      isNextStepFieldConfigured: true,
      nextStepFieldValue: null,
    });

    expect(state.hasNextStep).toBe(false);
    expect(state.reasons).toEqual(['nextStepMissing']);
  });

  it('uses the mapped next step date for overdue detection', () => {
    const state = getState({
      isNextStepFieldConfigured: true,
      nextStepFieldValue: 'Send NDA',
      nextStepMappedDate: '2026-09-01T09:00:00.000Z',
    });

    expect(state.isNextStepOverdue).toBe(true);
    expect(state.reasons).toEqual(['nextStepOverdue']);
  });

  it('keeps a deal fresh when a note was written recently, even if the record update is old', () => {
    const state = getState({
      activity: getActivity({ lastActivityAt: '2026-09-17T09:00:00.000Z' }),
      updatedAt: '2026-08-01T09:00:00.000Z',
    });

    expect(state.isStale).toBe(false);
    expect(state.daysSinceLastActivity).toBe(1);
    expect(state.daysSinceUpdate).toBe(48);
    expect(state.lastActivitySource).toBe('note');
  });

  it('is stale when the last real activity is older than the threshold', () => {
    const state = getState({
      activity: getActivity({ lastActivityAt: '2026-09-01T09:00:00.000Z' }),
    });

    expect(state.isStale).toBe(true);
    expect(state.reasons).toEqual(['noLinkedNextStep', 'stalled']);
  });

  it('is not stale for a young record without any recorded activity', () => {
    const state = getState({
      activity: getActivity({ lastActivityAt: null, lastActivitySource: null }),
      updatedAt: '2026-09-12T09:00:00.000Z',
    });

    expect(state.isStale).toBe(false);
    expect(state.daysSinceLastActivity).toBeNull();
  });

  it('is stale for an old record without any recorded activity', () => {
    const state = getState({
      activity: getActivity({ lastActivityAt: null, lastActivitySource: null }),
      updatedAt: '2026-08-01T09:00:00.000Z',
    });

    expect(state.isStale).toBe(true);
    expect(state.reasons).toEqual(['noLinkedNextStep', 'stalled']);
  });

  it('prefers a mapped last activity field when it is the newest activity', () => {
    const state = getState({
      activity: getActivity({ lastActivityAt: '2026-09-12T09:00:00.000Z' }),
      mappedLastActivity: '2026-09-17T09:00:00.000Z',
    });

    expect(state.lastActivityAt).toBe('2026-09-17T09:00:00.000Z');
    expect(state.lastActivitySource).toBe('mappedField');
    expect(state.isStale).toBe(false);
  });

  it('orders a passed close date before the other reasons', () => {
    const state = getState({
      activity: getActivity({ lastActivityAt: '2026-08-01T09:00:00.000Z' }),
      closeDate: '2026-09-10T09:00:00.000Z',
    });

    expect(state.reasons).toEqual([
      'closeDatePassed',
      'noLinkedNextStep',
      'stalled',
    ]);
  });
});
