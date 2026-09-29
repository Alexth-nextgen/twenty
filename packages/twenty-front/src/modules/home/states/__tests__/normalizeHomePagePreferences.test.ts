import { INBOX_PATH } from '@/home/constants/InboxPath';
import {
  DEFAULT_HOME_PAGE_PREFERENCES,
  DEFAULT_HOME_WIDGET_ORDER,
  normalizeHomePagePreferences,
} from '@/home/states/homePagePreferencesState';
import { AppPath } from 'twenty-shared/types';

// Whatever localStorage holds is untyped: a payload written by an older build,
// or garbage, reaches this function as is.
const normalizeStored = (stored: unknown) =>
  normalizeHomePagePreferences(
    stored as Parameters<typeof normalizeHomePagePreferences>[0],
  );

describe('normalizeHomePagePreferences', () => {
  it('falls back to the defaults when nothing is stored', () => {
    expect(normalizeHomePagePreferences(undefined)).toEqual(
      DEFAULT_HOME_PAGE_PREFERENCES,
    );
    expect(normalizeHomePagePreferences(null)).toEqual(
      DEFAULT_HOME_PAGE_PREFERENCES,
    );
  });

  it('keeps stored values and fills in the fields the payload does not have', () => {
    const normalized = normalizeHomePagePreferences({
      dashboardPeriod: 'month',
      deliveryRateTarget: 80,
    });

    expect(normalized.dashboardPeriod).toBe('month');
    expect(normalized.deliveryRateTarget).toBe(80);
    expect(normalized.hiddenWidgetIds).toEqual([]);
    expect(normalized.widgetOrder).toEqual(DEFAULT_HOME_WIDGET_ORDER);
    expect(normalized.startPage).toBe(AppPath.Home);
  });

  it('keeps a payload from before the widget order and the start page existed usable', () => {
    const legacyPayload = {
      dashboardView: 'team',
      openTaskTarget: 5,
      staleOpportunityDayLimit: 21,
    };

    const normalized = normalizeStored(legacyPayload);

    expect(normalized.dashboardView).toBe('team');
    expect(normalized.openTaskTarget).toBe(5);
    expect(normalized.staleOpportunityDayLimit).toBe(21);
    expect(normalized.hiddenWidgetIds).toEqual([]);
    expect(normalized.widgetOrder).toEqual(DEFAULT_HOME_WIDGET_ORDER);
    expect(normalized.startPage).toBe(AppPath.Home);
  });

  it('keeps a customized order, hidden widgets and start page', () => {
    const normalized = normalizeHomePagePreferences({
      hiddenWidgetIds: ['ai', 'recent-views'],
      startPage: INBOX_PATH,
      widgetOrder: ['tasks', 'meetings'],
    });

    expect(normalized.widgetOrder).toEqual(['tasks', 'meetings']);
    expect(normalized.hiddenWidgetIds).toEqual(['ai', 'recent-views']);
    expect(normalized.startPage).toBe(INBOX_PATH);
  });

  it('repairs a field that cannot be rendered', () => {
    expect(normalizeStored({ widgetOrder: [] }).widgetOrder).toEqual(
      DEFAULT_HOME_WIDGET_ORDER,
    );
    expect(normalizeStored({ widgetOrder: 'tasks' }).widgetOrder).toEqual(
      DEFAULT_HOME_WIDGET_ORDER,
    );
    expect(normalizeStored({ hiddenWidgetIds: 'ai' }).hiddenWidgetIds).toEqual(
      [],
    );
    expect(normalizeStored({ startPage: '' }).startPage).toBe(AppPath.Home);
    expect(normalizeStored({ startPage: null }).startPage).toBe(AppPath.Home);
  });

  it('keeps the field mappings and targets that were configured', () => {
    const signalFieldSettings = {
      lastActivityFieldMetadataId: 'last-activity-field-id',
      nextStepDateFieldMetadataId: null,
      nextStepFieldMetadataId: 'next-step-field-id',
      objectMetadataId: 'opportunity-object-metadata-id',
    };

    const normalized = normalizeHomePagePreferences({ signalFieldSettings });

    expect(normalized.signalFieldSettings).toEqual(signalFieldSettings);
    expect(normalized.teamOpenTaskTarget).toBe(
      DEFAULT_HOME_PAGE_PREFERENCES.teamOpenTaskTarget,
    );
  });
});
