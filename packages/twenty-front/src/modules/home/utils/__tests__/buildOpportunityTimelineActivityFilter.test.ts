import {
  buildOpportunityTimelineActivityFilter,
  getTimelineActivityTargetFieldName,
} from '@/home/utils/resolveOpportunitySignalFields';

describe('getTimelineActivityTargetFieldName', () => {
  it('derives the morph join column of the standard opportunity object', () => {
    expect(getTimelineActivityTargetFieldName('opportunity')).toBe(
      'targetOpportunityId',
    );
  });

  it('follows a workspace that names the target object differently', () => {
    expect(getTimelineActivityTargetFieldName('deal')).toBe('targetDealId');
    expect(getTimelineActivityTargetFieldName('investmentCase')).toBe(
      'targetInvestmentCaseId',
    );
  });
});

describe('buildOpportunityTimelineActivityFilter', () => {
  it('scopes the timeline to the tracked opportunities inside the window', () => {
    const filter = buildOpportunityTimelineActivityFilter({
      opportunityIds: ['opportunity-1', 'opportunity-2'],
      opportunityObjectNameSingular: 'opportunity',
      windowStartsAt: '2026-08-19T00:00:00.000Z',
    });

    expect(filter).toEqual({
      happensAt: { gte: '2026-08-19T00:00:00.000Z' },
      targetOpportunityId: { in: ['opportunity-1', 'opportunity-2'] },
    });
  });

  it('keeps an empty id list as an empty in filter rather than dropping it', () => {
    const filter = buildOpportunityTimelineActivityFilter({
      opportunityIds: [],
      opportunityObjectNameSingular: 'opportunity',
      windowStartsAt: '2026-08-19T00:00:00.000Z',
    });

    expect(filter).toEqual({
      happensAt: { gte: '2026-08-19T00:00:00.000Z' },
      targetOpportunityId: { in: [] },
    });
  });
});
