import { type HomeSignalFieldSettings } from '@/home/utils/resolveOpportunitySignalFields';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';
import type { INBOX_PATH } from '@/home/constants/InboxPath';
import { isNonEmptyString } from '@sniptt/guards';
import { AppPath } from 'twenty-shared/types';
import { isNonEmptyArray } from 'twenty-shared/utils';

export type HomeWidgetId =
  | 'ai'
  | 'meetings'
  | 'tasks'
  | 'quick-access'
  | 'recent-views';

export type LegacyHomeDashboardWidgetSource =
  | 'calendarEvent'
  | 'messageCampaign'
  | 'opportunity'
  | 'task';

export type LegacyHomeDashboardWidgetField =
  | 'amount'
  | 'closeDate'
  | 'count'
  | 'deliveryRate'
  | 'failedCount'
  | 'overdue'
  | 'stage'
  | 'dueAt';

export type HomeDashboardWidget = {
  aggregateOperation?:
    | 'AVG'
    | 'COUNT'
    | 'COUNT_EMPTY'
    | 'COUNT_FALSE'
    | 'COUNT_NOT_EMPTY'
    | 'COUNT_TRUE'
    | 'COUNT_UNIQUE_VALUES'
    | 'EARLIEST'
    | 'LATEST'
    | 'MAX'
    | 'MIN'
    | 'PERCENTAGE_EMPTY'
    | 'PERCENTAGE_NOT_EMPTY'
    | 'SUM';
  dateFieldMetadataId?: string | null;
  displayType?: 'distribution' | 'kpi';
  field?: LegacyHomeDashboardWidgetField;
  fieldMetadataId?: string | null;
  filterFieldMetadataId?: string | null;
  filterValue?: boolean | string | null;
  id: string;
  isHidden?: boolean;
  objectMetadataId?: string;
  scope?: 'personal' | 'team';
  source?: LegacyHomeDashboardWidgetSource;
  target: number | null;
  title: string;
};

export type HomePagePreferences = {
  customDashboardWidgets?: HomeDashboardWidget[];
  personalDashboardWidgets?: HomeDashboardWidget[];
  teamDashboardWidgets?: HomeDashboardWidget[];
  dashboardPeriod?: 'month' | 'week';
  dashboardView?: 'personal' | 'team';
  deliveryRateTarget?: number;
  hiddenWidgetIds: HomeWidgetId[];
  isAiCollapsed?: boolean;
  openTaskTarget?: number;
  signalFieldSettings?: HomeSignalFieldSettings;
  staleOpportunityDayLimit?: number;
  startPage: AppPath.Home | typeof INBOX_PATH;
  teamDeliveryRateTarget?: number;
  teamOpenTaskTarget?: number;
  teamWeeklyMeetingTarget?: number;
  weeklyMeetingTarget?: number;
  widgetOrder: HomeWidgetId[];
};

export const DEFAULT_HOME_WIDGET_ORDER: HomeWidgetId[] = [
  'ai',
  'meetings',
  'tasks',
  'quick-access',
  'recent-views',
];

export const DEFAULT_HOME_PAGE_PREFERENCES: HomePagePreferences = {
  dashboardPeriod: 'week',
  dashboardView: 'personal',
  deliveryRateTarget: 95,
  hiddenWidgetIds: [],
  isAiCollapsed: false,
  openTaskTarget: 10,
  staleOpportunityDayLimit: 14,
  startPage: AppPath.Home,
  teamDeliveryRateTarget: 95,
  teamOpenTaskTarget: 10,
  teamWeeklyMeetingTarget: 8,
  weeklyMeetingTarget: 8,
  widgetOrder: DEFAULT_HOME_WIDGET_ORDER,
};

/**
 * Preferences are persisted in localStorage and jotai hydrates the atom with the
 * stored payload as is: there is no migration step between builds. A payload
 * written by an older build therefore misses fields the current build treats as
 * required (`hiddenWidgetIds`, `widgetOrder`, `startPage`), and reading them
 * throws while the rest of the app keeps working.
 *
 * Normalizing on read keeps old payloads usable and stays correct once the shape
 * grows again, instead of forcing every consumer to guard each field.
 */
export const normalizeHomePagePreferences = (
  storedPreferences: Partial<HomePagePreferences> | null | undefined,
): HomePagePreferences => {
  const preferences = storedPreferences ?? {};

  return {
    ...DEFAULT_HOME_PAGE_PREFERENCES,
    ...preferences,
    hiddenWidgetIds: Array.isArray(preferences.hiddenWidgetIds)
      ? preferences.hiddenWidgetIds
      : DEFAULT_HOME_PAGE_PREFERENCES.hiddenWidgetIds,
    startPage: isNonEmptyString(preferences.startPage)
      ? preferences.startPage
      : DEFAULT_HOME_PAGE_PREFERENCES.startPage,
    widgetOrder: isNonEmptyArray(preferences.widgetOrder)
      ? preferences.widgetOrder
      : DEFAULT_HOME_PAGE_PREFERENCES.widgetOrder,
  };
};

export const homePagePreferencesState = createAtomState<HomePagePreferences>({
  key: 'homePagePreferencesState',
  defaultValue: DEFAULT_HOME_PAGE_PREFERENCES,
  useLocalStorage: true,
});
