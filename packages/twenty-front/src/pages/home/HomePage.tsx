import { AiChatTab } from '@/ai/components/AiChatTab';
import { AI_CHAT_SURFACE } from '@/ai/constants/AiChatSurface';
import { AiChatSurfaceContext } from '@/ai/contexts/AiChatSurfaceContext';
import { useStageAiChatPreprompt } from '@/ai/hooks/useStageAiChatPreprompt';
import { AGENT_CHAT_NEW_THREAD_DRAFT_KEY } from '@/ai/states/agentChatDraftsByThreadIdState';
import { currentAiChatThreadState } from '@/ai/states/currentAiChatThreadState';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import {
  OPPORTUNITY_LIMIT,
  TEAM_TASK_LIMIT,
  type TeamOpportunity,
  usePersonalWorkspaceItems,
} from '@/home/hooks/usePersonalWorkspaceItems';
import {
  getOpportunityActivityWindowDays,
  useOpportunityActivityById,
} from '@/home/hooks/useOpportunityActivityById';
import {
  type OpportunityActivitySource,
  type OpportunitySignalReason,
  getOpportunitySignalState,
} from '@/home/utils/getOpportunitySignalState';
import {
  type HomeSignalFieldSettings,
  LAST_ACTIVITY_FIELD_TYPES,
  NEXT_STEP_FIELD_TYPES,
  getMappedFieldDateValue,
  getMappedFieldTextValue,
  getSignalFieldCandidates,
} from '@/home/utils/resolveOpportunitySignalFields';
import { INBOX_PATH } from '@/home/constants/InboxPath';
import { useHomePagePreferences } from '@/home/hooks/useHomePagePreferences';
import {
  type HomePagePreferences,
  type HomeWidgetId,
  type HomeDashboardWidget,
  homePagePreferencesState,
  normalizeHomePagePreferences,
} from '@/home/states/homePagePreferencesState';
import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { metadataStoreState } from '@/metadata-store/states/metadataStoreState';
import { ObjectMetadataIcon } from '@/object-metadata/components/ObjectMetadataIcon';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { CoreObjectNamePlural } from '@/object-metadata/types/CoreObjectNamePlural';
import { isHiddenSystemField } from '@/object-metadata/utils/isHiddenSystemField';
import { filterReadableActiveObjectMetadataItems } from '@/object-metadata/utils/filterReadableActiveObjectMetadataItems';
import { lastVisitedViewPerObjectMetadataItemState } from '@/navigation/states/lastVisitedViewPerObjectMetadataItemState';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import {
  type AggregateRecordsData,
  useAggregateRecords,
} from '@/object-record/hooks/useAggregateRecords';
import { transformAggregateRawValueIntoAggregateDisplayValue } from '@/object-record/record-aggregate/utils/transformAggregateRawValueIntoAggregateDisplayValue';
import { getAggregateOperationLabel } from '@/object-record/record-board/record-board-column/utils/getAggregateOperationLabel';
import { AggregateOperations } from '@/object-record/record-table/constants/AggregateOperations';
import { type ExtendedAggregateOperations } from '@/object-record/record-table/types/ExtendedAggregateOperations';
import { getAvailableAggregationsFromObjectFields } from '@/object-record/utils/getAvailableAggregationsFromObjectFields';
import { makeAndFilterVariables } from '@/object-record/utils/makeAndFilterVariables';
import { RecordIndexSkeletonLoader } from '@/object-record/record-index/components/RecordIndexSkeletonLoader';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { useIsMobile } from 'twenty-ui/utilities';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { PageTitle } from '@/ui/utilities/page-title/components/PageTitle';
import { viewsSelector } from '@/views/states/selectors/viewsSelector';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import {
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { type ReactNode, useContext, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION } from 'twenty-shared/constants';
import {
  AppPath,
  CoreObjectNameSingular,
  FieldMetadataType,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';
import {
  IconArrowDown,
  IconArrowRight,
  IconArrowUp,
  IconAlertTriangle,
  IconCalendarEvent,
  IconChartBar,
  IconCheckbox,
  IconClock,
  IconCurrencyDollar,
  IconDatabase,
  IconHome,
  IconMail,
  IconPlus,
  IconSettings,
  IconTarget,
  IconTrash,
  IconTrendingDown,
  IconTrendingUp,
  IconUsers,
} from 'twenty-ui/icon';
import { MOBILE_VIEWPORT, themeCssVariables, useTheme } from 'twenty-ui/theme';
import {
  type AggregateOperations as GeneratedAggregateOperations,
  PermissionFlagType,
} from '~/generated-metadata/graphql';
import { MobileHomePage } from '~/pages/mobile-home/MobileHomePage';
import { dateLocaleState } from '~/localization/states/dateLocaleState';
import { UserContext } from '@/users/contexts/UserContext';
import { beautifyExactDate } from '~/utils/date-utils';

const CAMPAIGN_PREVIEW_LIMIT = 6;
const HOME_CONTENT_MAX_WIDTH = 960;
const HOME_ITEM_LIMIT = 5;
const TEAM_MEMBER_VISIBLE_LIMIT = 8;
const PRIORITY_ITEM_LIMIT = 5;
const STALE_OPPORTUNITY_DAY_LIMIT = 14;

type PriorityCategory = 'campaigns' | 'deals' | 'meetings' | 'tasks';
type PrioritySeverity = 'attention' | 'critical' | 'info';

type PriorityItem = {
  category: PriorityCategory;
  id: string;
  icon: ReactNode;
  meta: string;
  severity: PrioritySeverity;
  sortKey: number;
  title: string;
  to: string;
  weight: number;
};

// Lower weight means the signal is surfaced higher in "Important today".
const PRIORITY_WEIGHT = {
  campaignIssue: 3,
  dealRisk: 2,
  dueToday: 4,
  meeting: 5,
  overdueTask: 1,
} as const;

const getDeliveryRate = (
  campaigns: Array<{ deliveredCount: number; sentCount: number }>,
) => {
  const sentCount = campaigns.reduce(
    (total, campaign) => total + campaign.sentCount,
    0,
  );

  return sentCount === 0
    ? 0
    : Math.round(
        (campaigns.reduce(
          (total, campaign) => total + campaign.deliveredCount,
          0,
        ) /
          sentCount) *
          100,
      );
};

const getAggregatedCount = (data: AggregateRecordsData) =>
  Number(
    data[FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]?.[
      AggregateOperations.COUNT
    ] ?? 0,
  );

const getPipelineValueLabel = (
  opportunities: Array<{
    amount: {
      amountMicros: number | null;
      currencyCode: string | null;
    } | null;
  }>,
) => {
  const amountsByCurrency = new Map<string, number>();

  for (const opportunity of opportunities) {
    const amountMicros = opportunity.amount?.amountMicros;
    const currencyCode = opportunity.amount?.currencyCode;

    if (!isDefined(amountMicros) || !isNonEmptyString(currencyCode)) {
      continue;
    }

    amountsByCurrency.set(
      currencyCode,
      (amountsByCurrency.get(currencyCode) ?? 0) + amountMicros / 1_000_000,
    );
  }

  if (amountsByCurrency.size === 0) {
    return '—';
  }

  return [...amountsByCurrency.entries()]
    .map(
      ([currencyCode, amount]) =>
        `${new Intl.NumberFormat(undefined, {
          maximumFractionDigits: 1,
          notation: 'compact',
        }).format(amount)} ${currencyCode}`,
    )
    .join(' · ');
};

const StyledContent = styled.div`
  align-self: center;
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[6]};
  max-width: ${HOME_CONTENT_MAX_WIDTH}px;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[10]} ${themeCssVariables.spacing[8]};
  width: 100%;

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    padding: ${themeCssVariables.spacing[6]} ${themeCssVariables.spacing[4]};
  }
`;

const StyledGreetingRow = styled.div`
  align-items: flex-start;
  display: flex;
  gap: ${themeCssVariables.spacing[4]};
  justify-content: space-between;
`;

const StyledGreeting = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledGreetingTitle = styled.h1`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xxl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledMutedText = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.md};
  margin: 0;
`;

const StyledButton = styled.button<{ active?: boolean }>`
  align-items: center;
  background: ${({ active }) =>
    active
      ? themeCssVariables.background.transparent.medium
      : themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  gap: ${themeCssVariables.spacing[1]};
  min-height: 30px;
  padding: 0 ${themeCssVariables.spacing[2]};

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }

  &:disabled {
    cursor: default;
    opacity: 0.45;
  }
`;

const StyledPreferences = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.lg};
  bottom: ${themeCssVariables.spacing[4]};
  box-shadow: ${themeCssVariables.boxShadow.strong};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  max-width: min(520px, calc(100vw - 32px));
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[4]};
  position: fixed;
  right: ${themeCssVariables.spacing[4]};
  top: 72px;
  width: 100%;
  z-index: 20;
`;

const StyledPreferencesHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 1;
`;

const StyledCustomWidgetList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledCustomWidgetEditor = styled.div`
  align-items: center;
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(4, minmax(130px, 1fr)) 72px 32px;
  padding: ${themeCssVariables.spacing[2]};

  @media (max-width: 800px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const StyledPreferenceSelect = styled.select`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  font-family: inherit;
  height: 30px;
  min-width: 0;
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledCustomWidgetGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const StyledCustomWidgetCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.lg};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledDistributionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledDistributionRow = styled.div`
  align-items: center;
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: minmax(80px, 1fr) minmax(70px, 2fr) 32px;
`;

const StyledDistributionValue = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledPreferenceRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledSignalSettings = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding-top: ${themeCssVariables.spacing[3]};
`;

const StyledSignalField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const StyledSignalSettingsRow = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
`;

const StyledPreferenceLabel = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  margin-right: ${themeCssVariables.spacing[2]};
`;

const StyledWidgetFrame = styled.div<{
  isCustomizing?: boolean;
  isHidden: boolean;
}>`
  cursor: ${({ isCustomizing }) => (isCustomizing ? 'grab' : 'default')};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  opacity: ${({ isHidden }) => (isHidden ? 0.55 : 1)};
`;

const StyledWidgetControls = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px dashed ${themeCssVariables.border.color.strong};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledActions = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledAiChatContainer = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.lg};
  display: flex;
  flex-direction: column;
  height: 380px;
  overflow: hidden;
`;

const StyledAiHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const StyledAiQuickActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledAiContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  min-width: 0;
`;

const StyledSectionHeading = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const StyledSectionTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledSectionLink = styled(Link)`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  text-decoration: none;
`;

const StyledCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.lg};
  display: flex;
  flex-direction: column;
  min-height: 170px;
  overflow: hidden;
`;

const StyledRecordLink = styled(Link)`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  min-height: ${themeCssVariables.spacing[9]};
  padding: 0 ${themeCssVariables.spacing[4]};
  text-decoration: none;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledRecordTitle = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledRecordMeta = styled.span<{ isOverdue?: boolean }>`
  align-items: center;
  color: ${({ isOverdue }) =>
    isOverdue
      ? themeCssVariables.color.red
      : themeCssVariables.font.color.tertiary};
  display: flex;
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledEmptyState = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: center;
  padding: ${themeCssVariables.spacing[6]};
  text-align: center;
`;

const StyledShortcutGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledShortcutLink = styled(Link)`
  align-items: center;
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: center;
  min-height: 78px;
  padding: ${themeCssVariables.spacing[2]};
  text-align: center;
  text-decoration: none;
`;

const StyledTruncatedText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
`;

const StyledViewGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(3, minmax(0, 1fr));
`;

const StyledViewLink = styled(Link)`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.lg};
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[4]};
  text-decoration: none;
`;

const StyledViewText = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
`;

const StyledSmallMutedText = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledDashboardHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
`;

const StyledDashboardTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledDashboardEyebrow = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  text-transform: uppercase;
`;

const StyledDashboardTabs = styled.div`
  background: ${themeCssVariables.background.transparent.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  padding: 2px;
`;

const StyledDashboardControls = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
`;

const StyledDashboardTab = styled.button<{ active: boolean }>`
  background: ${({ active }) =>
    active
      ? themeCssVariables.background.primary
      : themeCssVariables.background.transparent.light};
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  box-shadow: ${({ active }) =>
    active ? themeCssVariables.boxShadow.light : 'none'};
  color: ${({ active }) =>
    active
      ? themeCssVariables.font.color.primary
      : themeCssVariables.font.color.tertiary};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  min-height: 28px;
  padding: 0 ${themeCssVariables.spacing[3]};

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
    outline-offset: 1px;
  }
`;

const StyledKpiGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(4, minmax(0, 1fr));

  @media (max-width: 800px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const StyledKpiCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.lg};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-height: 118px;
  min-width: 0;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledFilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]};
`;

const StyledKpiLabel = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledKpiValue = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xxl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledKpiContext = styled.span<{ warning?: boolean }>`
  color: ${({ warning }) =>
    warning
      ? themeCssVariables.color.red
      : themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledKpiFooter = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledDelta = styled.span<{ positive?: boolean; warning?: boolean }>`
  align-items: center;
  color: ${({ positive, warning }) =>
    warning
      ? themeCssVariables.color.red
      : positive
        ? themeCssVariables.color.green
        : themeCssVariables.font.color.tertiary};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: 2px;
`;

const StyledTargetTrack = styled.div`
  background: ${themeCssVariables.background.transparent.medium};
  border-radius: ${themeCssVariables.border.radius.rounded};
  height: 3px;
  overflow: hidden;
`;

type TargetProgressTone = 'attention' | 'critical' | 'default' | 'success';

const StyledTargetValue = styled.div<{
  tone: TargetProgressTone;
  value: number;
}>`
  background: ${({ tone }) =>
    tone === 'critical'
      ? themeCssVariables.color.red
      : tone === 'attention'
        ? themeCssVariables.color.amber
        : tone === 'success'
          ? themeCssVariables.color.green
          : themeCssVariables.color.blue};
  border-radius: inherit;
  height: 100%;
  width: ${({ value }) => `${Math.min(100, Math.max(0, value))}%`};
`;

const TargetProgressBar = ({
  ariaLabel,
  tone = 'default',
  value,
  valueText,
}: {
  ariaLabel: string;
  tone?: TargetProgressTone;
  value: number;
  valueText: string;
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <StyledTargetTrack
      aria-label={ariaLabel}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(clampedValue)}
      aria-valuetext={valueText}
      role="progressbar"
    >
      <StyledTargetValue tone={tone} value={clampedValue} />
    </StyledTargetTrack>
  );
};

const StyledPanel = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.lg};
  display: flex;
  flex-direction: column;
  min-height: 140px;
  min-width: 0;
  overflow: hidden;
`;

const StyledPriorityList = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledPriorityRow = styled(Link)`
  align-items: center;
  color: ${themeCssVariables.font.color.primary};
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: 28px minmax(0, 1fr) auto;
  min-height: 48px;
  padding: 0 ${themeCssVariables.spacing[4]};
  text-decoration: none;

  &:not(:last-child) {
    border-bottom: 1px solid ${themeCssVariables.border.color.light};
  }

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
    outline-offset: -2px;
  }
`;

const StyledPriorityIcon = styled.div<{ severity?: PrioritySeverity }>`
  align-items: center;
  color: ${({ severity }) =>
    severity === 'critical'
      ? themeCssVariables.color.red
      : severity === 'attention'
        ? themeCssVariables.color.amber
        : themeCssVariables.font.color.tertiary};
  display: flex;
  justify-content: center;
`;

const StyledPriorityReason = styled.span<{ severity?: PrioritySeverity }>`
  color: ${({ severity }) =>
    severity === 'critical'
      ? themeCssVariables.color.red
      : severity === 'attention'
        ? themeCssVariables.color.amber
        : themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledPriorityText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const StyledDataStatus = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex-wrap: wrap;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledDataStatusItem = styled.span`
  align-items: center;
  display: inline-flex;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledPanelHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  justify-content: space-between;
  min-height: 44px;
  padding: 0 ${themeCssVariables.spacing[4]};
`;

const StyledPanelTitle = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledCampaignRow = styled(Link)`
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
  text-decoration: none;

  &:not(:last-child) {
    border-bottom: 1px solid ${themeCssVariables.border.color.light};
  }

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledCampaignHeading = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledStatusBadge = styled.span`
  background: ${themeCssVariables.background.transparent.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  padding: 2px ${themeCssVariables.spacing[1]};
  text-transform: lowercase;
`;

const StyledProgressTrack = styled.div`
  background: ${themeCssVariables.background.transparent.medium};
  border-radius: ${themeCssVariables.border.radius.rounded};
  height: 4px;
  overflow: hidden;
`;

const StyledProgressValue = styled.div<{ value: number }>`
  background: ${themeCssVariables.color.blue};
  border-radius: inherit;
  height: 100%;
  width: ${({ value }) => `${value}%`};
`;

const StyledCampaignMetrics = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex-wrap: wrap;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledPipelineSummary = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[6]};
  grid-template-columns: minmax(220px, 0.9fr) minmax(0, 2.4fr);
  padding: ${themeCssVariables.spacing[6]} ${themeCssVariables.spacing[5]};

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const StyledPipelinePanel = styled(StyledPanel)`
  min-height: 560px;
  order: 2;
`;

const StyledCampaignPanel = styled(StyledPanel)`
  order: 1;
`;

const StyledOperationalStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[6]};
`;

const StyledPipelineTotals = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledPipelineValue = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledStageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  max-height: 220px;
  overflow-y: auto;
  padding-right: ${themeCssVariables.spacing[2]};
  scrollbar-gutter: stable;
`;

const StyledStageRow = styled(Link)`
  align-items: center;
  color: inherit;
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: minmax(80px, 1fr) 3fr 24px;
  text-decoration: none;

  &:hover {
    opacity: 0.75;
  }
`;

const StyledStageCount = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  text-align: right;
`;

const StyledOpportunityRow = styled(Link)`
  align-items: center;
  color: ${themeCssVariables.font.color.primary};
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: minmax(0, 2fr) minmax(90px, 1fr) auto;
  min-height: 48px;
  padding: 0 ${themeCssVariables.spacing[4]};
  text-decoration: none;

  &:not(:last-child) {
    border-bottom: 1px solid ${themeCssVariables.border.color.light};
  }

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledMemberCell = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
`;

const StyledMetricCell = styled.div`
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: 2px;
  min-width: 0;
`;

const StyledMemberAvatar = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.transparent.medium};
  border-radius: ${themeCssVariables.border.radius.rounded};
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  height: 28px;
  justify-content: center;
  width: 28px;
`;

const StyledMemberName = styled.div`
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  flex-direction: column;
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  padding-top: ${themeCssVariables.spacing[1]};
`;

const StyledPreferenceInput = styled.input`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  font-family: inherit;
  height: 28px;
  padding: 0 ${themeCssVariables.spacing[2]};
  width: 64px;

  &:focus-visible {
    border-color: ${themeCssVariables.color.blue};
    outline: none;
  }
`;

const StyledCustomWidgetTitleInput = styled(StyledPreferenceInput)`
  width: 100%;
`;

const StyledPreferenceTarget = styled.label`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledWorkloadBadge = styled.span<{ warning?: boolean }>`
  background: ${({ warning }) =>
    warning
      ? themeCssVariables.color.red3
      : themeCssVariables.background.transparent.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ warning }) =>
    warning
      ? themeCssVariables.color.red
      : themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  padding: 2px ${themeCssVariables.spacing[1]};
`;

const StyledWorkstreamGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: ${themeCssVariables.spacing[4]};

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const StyledWorkstreamCard = styled.div`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledWorkstreamMetrics = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
`;

const StyledMyDayGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const getWidgetAggregateOperations = ({
  fieldName,
  objectMetadataItem,
}: {
  fieldName: string;
  objectMetadataItem: EnrichedObjectMetadataItem;
}) => {
  const operations = Object.keys(
    getAvailableAggregationsFromObjectFields(objectMetadataItem.readableFields)[
      fieldName
    ] ?? {},
  ) as ExtendedAggregateOperations[];
  const fieldMetadataItem = objectMetadataItem.readableFields.find(
    (field) => field.name === fieldName,
  );

  // A generic aggregate cannot guarantee a single currency code.
  return fieldMetadataItem?.type === FieldMetadataType.CURRENCY
    ? operations.filter((operation) =>
        [
          AggregateOperations.COUNT,
          AggregateOperations.COUNT_EMPTY,
          AggregateOperations.COUNT_NOT_EMPTY,
        ].includes(operation as AggregateOperations),
      )
    : operations;
};

const getPersonalScopeFieldName = (
  objectMetadataItem: EnrichedObjectMetadataItem,
) => {
  const personalRelationField = objectMetadataItem.readableFields.find(
    (fieldMetadataItem) =>
      fieldMetadataItem.type === FieldMetadataType.RELATION &&
      ['assignee', 'owner', 'workspaceMember'].includes(fieldMetadataItem.name),
  );

  return isDefined(personalRelationField)
    ? `${personalRelationField.name}Id`
    : undefined;
};

const getCustomWidgetFilter = ({
  currentWorkspaceMemberId,
  objectMetadataItem,
  periodEndsAt,
  periodStartsAt,
  widget,
}: {
  currentWorkspaceMemberId: string | undefined;
  objectMetadataItem: EnrichedObjectMetadataItem;
  periodEndsAt: Date;
  periodStartsAt: Date;
  widget: HomeDashboardWidget;
}) => {
  const dateFieldMetadataItem = objectMetadataItem.readableFields.find(
    (fieldMetadataItem) => fieldMetadataItem.id === widget.dateFieldMetadataId,
  );
  const filterFieldMetadataItem = objectMetadataItem.readableFields.find(
    (fieldMetadataItem) =>
      fieldMetadataItem.id === widget.filterFieldMetadataId,
  );
  const personalScopeFieldName = getPersonalScopeFieldName(objectMetadataItem);
  const requestedPersonalScope = widget.scope === 'personal';
  const isPersonalScopeUnavailable =
    requestedPersonalScope && !isDefined(personalScopeFieldName);

  return {
    dateFieldMetadataItem,
    filterFieldMetadataItem,
    isPersonalScopeUnavailable,
    filter: makeAndFilterVariables([
      isDefined(dateFieldMetadataItem)
        ? ({
            [dateFieldMetadataItem.name]: {
              gte: periodStartsAt.toISOString(),
              lte: periodEndsAt.toISOString(),
            },
          } as RecordGqlOperationFilter)
        : undefined,
      requestedPersonalScope &&
      isDefined(personalScopeFieldName) &&
      isDefined(currentWorkspaceMemberId)
        ? ({
            [personalScopeFieldName]: { eq: currentWorkspaceMemberId },
          } as RecordGqlOperationFilter)
        : undefined,
      isDefined(filterFieldMetadataItem) && isDefined(widget.filterValue)
        ? ({
            [filterFieldMetadataItem.name]: { eq: widget.filterValue },
          } as RecordGqlOperationFilter)
        : undefined,
    ]),
  };
};

type HomeDashboardCustomWidgetCardProps = {
  objectMetadataItem: EnrichedObjectMetadataItem | undefined;
  periodEndsAt: Date;
  periodStartsAt: Date;
  widget: HomeDashboardWidget;
};

const HomeDashboardCustomWidgetCard = ({
  objectMetadataItem,
  periodEndsAt,
  periodStartsAt,
  widget,
}: HomeDashboardCustomWidgetCardProps) => {
  const { t } = useLingui();

  if (!isDefined(objectMetadataItem)) {
    return (
      <StyledCustomWidgetCard>
        <StyledKpiLabel>{widget.title}</StyledKpiLabel>
        <StyledKpiValue>—</StyledKpiValue>
        <StyledKpiContext warning>
          {t`Configuration needs an update`}
        </StyledKpiContext>
      </StyledCustomWidgetCard>
    );
  }

  const distributionFieldMetadataItem = objectMetadataItem.readableFields.find(
    (fieldMetadataItem) => fieldMetadataItem.id === widget.fieldMetadataId,
  );

  if (
    widget.displayType === 'distribution' &&
    distributionFieldMetadataItem?.type === FieldMetadataType.SELECT
  ) {
    return (
      <HomeDashboardDistributionWidgetCard
        objectMetadataItem={objectMetadataItem}
        periodEndsAt={periodEndsAt}
        periodStartsAt={periodStartsAt}
        widget={widget}
      />
    );
  }

  return (
    <AvailableHomeDashboardCustomWidgetCard
      objectMetadataItem={objectMetadataItem}
      periodEndsAt={periodEndsAt}
      periodStartsAt={periodStartsAt}
      widget={widget}
    />
  );
};

type HomeDashboardDistributionOptionProps = {
  baseFilter: RecordGqlOperationFilter | undefined;
  objectNameSingular: string;
  optionLabel: string;
  optionValue: string;
  selectedFieldName: string;
  totalCount: number;
};

const HomeDashboardDistributionOption = ({
  baseFilter,
  objectNameSingular,
  optionLabel,
  optionValue,
  selectedFieldName,
  totalCount,
}: HomeDashboardDistributionOptionProps) => {
  const { data, loading, error } = useAggregateRecords({
    objectNameSingular,
    recordGqlFieldsAggregate: {
      [FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]: [AggregateOperations.COUNT],
    },
    filter: makeAndFilterVariables([
      baseFilter,
      { [selectedFieldName]: { eq: optionValue } },
    ]),
  });
  const count = Number(
    data[FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]?.[
      AggregateOperations.COUNT
    ] ?? 0,
  );

  return (
    <StyledDistributionRow>
      <StyledDistributionValue>{optionLabel}</StyledDistributionValue>
      <StyledProgressTrack
        aria-label={optionLabel}
        aria-valuemax={totalCount}
        aria-valuemin={0}
        aria-valuenow={count}
        role="progressbar"
      >
        <StyledProgressValue
          value={totalCount > 0 ? (count / totalCount) * 100 : 0}
        />
      </StyledProgressTrack>
      <StyledDistributionValue>
        {loading ? '…' : error ? '—' : count}
      </StyledDistributionValue>
    </StyledDistributionRow>
  );
};

const HomeDashboardDistributionWidgetCard = ({
  objectMetadataItem,
  periodEndsAt,
  periodStartsAt,
  widget,
}: HomeDashboardCustomWidgetCardProps & {
  objectMetadataItem: EnrichedObjectMetadataItem;
}) => {
  const { t } = useLingui();
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const selectedFieldMetadataItem = objectMetadataItem.readableFields.find(
    (fieldMetadataItem) => fieldMetadataItem.id === widget.fieldMetadataId,
  );
  const { filter, isPersonalScopeUnavailable } = getCustomWidgetFilter({
    currentWorkspaceMemberId: currentWorkspaceMember?.id,
    objectMetadataItem,
    periodEndsAt,
    periodStartsAt,
    widget,
  });
  const { data, loading, error } = useAggregateRecords({
    objectNameSingular: objectMetadataItem.nameSingular,
    recordGqlFieldsAggregate: {
      [FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]: [AggregateOperations.COUNT],
    },
    filter,
    skip: !isDefined(selectedFieldMetadataItem) || isPersonalScopeUnavailable,
  });
  const totalCount = Number(
    data[FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]?.[
      AggregateOperations.COUNT
    ] ?? 0,
  );

  return (
    <StyledCustomWidgetCard>
      <StyledKpiLabel>
        <ObjectMetadataIcon objectMetadataItem={objectMetadataItem} />
        {widget.title}
      </StyledKpiLabel>
      {loading ? (
        <StyledKpiValue>…</StyledKpiValue>
      ) : error || !isDefined(selectedFieldMetadataItem) ? (
        <StyledKpiContext
          warning
        >{t`Data could not be loaded`}</StyledKpiContext>
      ) : isPersonalScopeUnavailable ? (
        <StyledKpiContext warning>
          {t`No owner field is available for personal scope`}
        </StyledKpiContext>
      ) : (
        <StyledDistributionList>
          {selectedFieldMetadataItem.options?.map((option) => (
            <HomeDashboardDistributionOption
              key={option.value}
              baseFilter={filter}
              objectNameSingular={objectMetadataItem.nameSingular}
              optionLabel={option.label}
              optionValue={option.value}
              selectedFieldName={selectedFieldMetadataItem.name}
              totalCount={totalCount}
            />
          ))}
        </StyledDistributionList>
      )}
      <StyledSmallMutedText>
        {selectedFieldMetadataItem?.label ?? t`Configuration needs an update`} ·{' '}
        {t`${totalCount} records`}
      </StyledSmallMutedText>
    </StyledCustomWidgetCard>
  );
};

const AvailableHomeDashboardCustomWidgetCard = ({
  objectMetadataItem,
  periodEndsAt,
  periodStartsAt,
  widget,
}: HomeDashboardCustomWidgetCardProps & {
  objectMetadataItem: EnrichedObjectMetadataItem;
}) => {
  const { t } = useLingui();
  const { dateFormat, timeFormat, timeZone } = useContext(UserContext);
  const dateLocale = useAtomStateValue(dateLocaleState);
  const { numberFormat, formatNumber } = useNumberFormat();
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const aggregateOperation = (widget.aggregateOperation ??
    AggregateOperations.COUNT) as ExtendedAggregateOperations;
  const aggregateFieldMetadataItem = objectMetadataItem.readableFields.find(
    (fieldMetadataItem) => fieldMetadataItem.id === widget.fieldMetadataId,
  );
  const aggregateFieldName = isDefined(aggregateFieldMetadataItem)
    ? aggregateFieldMetadataItem.name
    : FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION;
  const requestedPersonalScope = widget.scope === 'personal';
  const {
    dateFieldMetadataItem,
    filterFieldMetadataItem,
    filter,
    isPersonalScopeUnavailable,
  } = getCustomWidgetFilter({
    currentWorkspaceMemberId: currentWorkspaceMember?.id,
    objectMetadataItem,
    periodEndsAt,
    periodStartsAt,
    widget,
  });
  const availableOperations = getWidgetAggregateOperations({
    fieldName: aggregateFieldName,
    objectMetadataItem,
  });
  const isConfigurationValid = availableOperations.includes(aggregateOperation);
  const { data, loading, error } = useAggregateRecords({
    objectNameSingular: objectMetadataItem.nameSingular,
    recordGqlFieldsAggregate: {
      [aggregateFieldName]: [aggregateOperation],
    },
    filter,
    skip:
      !isConfigurationValid ||
      isPersonalScopeUnavailable ||
      (requestedPersonalScope && !isDefined(currentWorkspaceMember)),
  });
  const aggregateRawValue = data[aggregateFieldName]?.[aggregateOperation];
  const displayValue = isDefined(aggregateFieldMetadataItem)
    ? transformAggregateRawValueIntoAggregateDisplayValue({
        aggregateFieldMetadataItem,
        aggregateOperation,
        aggregateRawValue,
        dateFormat,
        localeCatalog: dateLocale.localeCatalog,
        numberFormat,
        timeFormat,
        timeZone,
      })
    : isDefined(aggregateRawValue)
      ? formatNumber(Number(aggregateRawValue))
      : '—';
  const isPercentage = [
    AggregateOperations.PERCENTAGE_EMPTY,
    AggregateOperations.PERCENTAGE_NOT_EMPTY,
  ].includes(aggregateOperation as GeneratedAggregateOperations);
  const numericValue = isDefined(aggregateRawValue)
    ? Number(aggregateRawValue) * (isPercentage ? 100 : 1)
    : 0;
  const target = widget.target;
  const supportsNumericTarget = !['EARLIEST', 'LATEST'].includes(
    aggregateOperation,
  );

  return (
    <StyledCustomWidgetCard>
      <StyledKpiLabel>
        <ObjectMetadataIcon objectMetadataItem={objectMetadataItem} />
        {widget.title}
      </StyledKpiLabel>
      <StyledKpiValue>
        {loading ? '…' : error ? '—' : displayValue}
      </StyledKpiValue>
      <StyledKpiContext warning={isDefined(error) || !isConfigurationValid}>
        {isPersonalScopeUnavailable
          ? t`No owner field is available for personal scope`
          : !isConfigurationValid
            ? t`Configuration needs an update`
            : isDefined(error)
              ? t`Data could not be loaded`
              : `${objectMetadataItem.labelPlural} · ${getAggregateOperationLabel(aggregateOperation)}${isDefined(dateFieldMetadataItem) ? ` · ${dateFieldMetadataItem.label}` : ''}${isDefined(filterFieldMetadataItem) ? ` · ${filterFieldMetadataItem.label}` : ''}`}
      </StyledKpiContext>
      {supportsNumericTarget && isDefined(target) && target > 0 && !loading && (
        <>
          <TargetProgressBar
            ariaLabel={t`Progress towards target`}
            tone={numericValue >= target ? 'success' : 'default'}
            value={(numericValue / target) * 100}
            valueText={t`${displayValue} of target ${target}`}
          />
          <StyledSmallMutedText>{t`Target ${target}`}</StyledSmallMutedText>
        </>
      )}
    </StyledCustomWidgetCard>
  );
};

const HomePageContent = () => {
  const { t } = useLingui();
  const theme = useTheme();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<HomeWidgetId | null>(
    null,
  );
  const [priorityFilter, setPriorityFilter] = useState<
    'all' | 'campaigns' | 'deals' | 'meetings' | 'tasks'
  >('all');
  const [isPriorityListExpanded, setIsPriorityListExpanded] = useState(false);
  // A payload persisted by an older build can miss fields this render reads
  // unconditionally, so reads go through the normalized value. Writes store the
  // normalized shape, which repairs an outdated payload on the next change.
  const homePagePreferences = useHomePagePreferences();
  const setHomePagePreferences = useSetAtomState(homePagePreferencesState);
  const updateHomePagePreferences = (
    update: (current: HomePagePreferences) => HomePagePreferences,
  ) =>
    setHomePagePreferences((current) =>
      update(normalizeHomePagePreferences(current)),
    );
  const currentAiChatThread = useAtomStateValue(currentAiChatThreadState);
  const { stageAiChatPreprompt } = useStageAiChatPreprompt();
  const hasTeamDashboardPermission = useHasPermissionFlag(
    PermissionFlagType.WORKSPACE_MEMBERS,
  );
  const preferredDashboardView =
    homePagePreferences.dashboardView ?? 'personal';
  const dashboardView =
    preferredDashboardView === 'team' && hasTeamDashboardPermission
      ? 'team'
      : 'personal';
  const dashboardPeriod = homePagePreferences.dashboardPeriod ?? 'week';
  const deliveryRateTarget =
    dashboardView === 'team'
      ? (homePagePreferences.teamDeliveryRateTarget ?? 95)
      : (homePagePreferences.deliveryRateTarget ?? 95);
  const openTaskTarget =
    dashboardView === 'team'
      ? (homePagePreferences.teamOpenTaskTarget ?? 10)
      : (homePagePreferences.openTaskTarget ?? 10);
  const weeklyMeetingTarget =
    dashboardView === 'team'
      ? (homePagePreferences.teamWeeklyMeetingTarget ?? 8)
      : (homePagePreferences.weeklyMeetingTarget ?? 8);
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const objectMetadataItems = useAtomStateValue(objectMetadataItemsSelector);
  const views = useAtomStateValue(viewsSelector);
  const lastVisitedViewPerObjectMetadataItem = useAtomStateValue(
    lastVisitedViewPerObjectMetadataItemState,
  );
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const hasAiPermission = useHasPermissionFlag(PermissionFlagType.AI);
  const {
    areCalendarEventsLoading,
    areMessageCampaignsLoading,
    areOpportunitiesLoading,
    areTasksLoading,
    areTeamTasksLoading,
    areWorkspaceMembersLoading,
    calendarEvents,
    isCalendarEventListTruncated,
    isMessageCampaignListTruncated,
    isOpportunityListTruncated,
    isPersonalTaskListTruncated,
    isTeamTaskListTruncated,
    messageCampaigns,
    meetings,
    monthMeetings,
    opportunities,
    opportunityObjectMetadataItem,
    opportunitySignalFields,
    overdueTasks,
    previousMonthMeetings,
    previousWeekMeetings,
    tasks,
    teamTasks,
    weekMeetings,
    workspaceMembers,
  } = usePersonalWorkspaceItems();

  const readableObjects = useMemo(
    () =>
      filterReadableActiveObjectMetadataItems(
        objectMetadataItems,
        objectPermissionsByObjectMetadataId,
      ),
    [objectMetadataItems, objectPermissionsByObjectMetadataId],
  );
  const trackedOpportunityIds = useMemo(
    () => opportunities.map((opportunity) => opportunity.id),
    [opportunities],
  );
  const {
    activityById: opportunityActivityById,
    diagnostics: opportunityActivityDiagnostics,
  } = useOpportunityActivityById({
    calendarEvents,
    opportunityIds: trackedOpportunityIds,
    opportunityObjectNameSingular: opportunityObjectMetadataItem?.nameSingular,
    tasks: teamTasks,
  });
  const getObjectIndexPath = (objectNameSingular: CoreObjectNameSingular) => {
    const objectMetadataItem = readableObjects.find(
      (item) => item.nameSingular === objectNameSingular,
    );

    return isDefined(objectMetadataItem)
      ? getAppPath(AppPath.RecordIndexPage, {
          objectNamePlural: objectMetadataItem.namePlural,
        })
      : null;
  };
  const calendarIndexPath = getObjectIndexPath(
    CoreObjectNameSingular.CalendarEvent,
  );
  const campaignsIndexPath = getObjectIndexPath(
    CoreObjectNameSingular.MessageCampaign,
  );
  const opportunitiesIndexPath = getObjectIndexPath(
    CoreObjectNameSingular.Opportunity,
  );
  const tasksIndexPath = getObjectIndexPath(CoreObjectNameSingular.Task);
  const storedCustomDashboardWidgets =
    dashboardView === 'personal'
      ? (homePagePreferences.personalDashboardWidgets ??
        homePagePreferences.customDashboardWidgets ??
        [])
      : (homePagePreferences.teamDashboardWidgets ?? []);
  const customDashboardWidgets = storedCustomDashboardWidgets.map((widget) => {
    if (isDefined(widget.objectMetadataId)) {
      return widget;
    }

    const legacyObjectNameSingular = isDefined(widget.source)
      ? {
          calendarEvent: CoreObjectNameSingular.CalendarEvent,
          messageCampaign: CoreObjectNameSingular.MessageCampaign,
          opportunity: CoreObjectNameSingular.Opportunity,
          task: CoreObjectNameSingular.Task,
        }[widget.source]
      : undefined;
    const objectMetadataItem = readableObjects.find(
      (item) => item.nameSingular === legacyObjectNameSingular,
    );
    const legacyFieldName =
      widget.field === 'overdue'
        ? 'dueAt'
        : widget.field === 'count'
          ? undefined
          : widget.field;
    const fieldMetadataItem = objectMetadataItem?.readableFields.find(
      (item) => item.name === legacyFieldName,
    );
    const aggregateOperation =
      widget.field === 'amount' || widget.field === 'failedCount'
        ? AggregateOperations.SUM
        : AggregateOperations.COUNT;

    return {
      ...widget,
      aggregateOperation,
      dateFieldMetadataId:
        widget.field === 'closeDate' ||
        widget.field === 'dueAt' ||
        widget.field === 'overdue'
          ? fieldMetadataItem?.id
          : null,
      fieldMetadataId:
        aggregateOperation === AggregateOperations.COUNT
          ? null
          : fieldMetadataItem?.id,
      objectMetadataId: objectMetadataItem?.id,
      scope: dashboardView === 'personal' ? 'personal' : 'team',
    } satisfies HomeDashboardWidget;
  });
  const shortcutObjects = useMemo(
    () =>
      [
        CoreObjectNameSingular.Person,
        CoreObjectNameSingular.Company,
        CoreObjectNameSingular.Opportunity,
        CoreObjectNameSingular.Task,
      ]
        .map((name) =>
          readableObjects.find((item) => item.nameSingular === name),
        )
        .filter(isDefined),
    [readableObjects],
  );
  const recentViews = useMemo(
    () =>
      Object.entries(lastVisitedViewPerObjectMetadataItem ?? {})
        .map(([objectMetadataItemId, viewId]) => {
          const objectMetadataItem = readableObjects.find(
            (item) => item.id === objectMetadataItemId,
          );
          const view = views.find((item) => item.id === viewId);
          return isDefined(objectMetadataItem) && isDefined(view)
            ? { objectMetadataItem, view }
            : null;
        })
        .filter(isDefined)
        .slice(0, 3),
    [lastVisitedViewPerObjectMetadataItem, readableObjects, views],
  );
  const currentPeriodMeetings =
    dashboardPeriod === 'week' ? weekMeetings : monthMeetings;
  const previousPeriodMeetings =
    dashboardPeriod === 'week' ? previousWeekMeetings : previousMonthMeetings;
  const periodMeetingTarget =
    dashboardPeriod === 'week' ? weeklyMeetingTarget : weeklyMeetingTarget * 4;
  const today = new Date();
  const todayIsoString = today.toISOString();
  const periodStartsAt =
    dashboardPeriod === 'week'
      ? startOfWeek(new Date(), { weekStartsOn: 1 })
      : startOfMonth(new Date());
  const periodEndsAt =
    dashboardPeriod === 'week'
      ? endOfWeek(new Date(), { weekStartsOn: 1 })
      : endOfMonth(new Date());
  const teamPeriodCalendarEvents = calendarEvents.filter(
    (calendarEvent) =>
      isDefined(calendarEvent.startsAt) &&
      new Date(calendarEvent.startsAt) >= periodStartsAt &&
      new Date(calendarEvent.startsAt) <= periodEndsAt,
  );
  const staleOpportunityDayLimit =
    homePagePreferences.staleOpportunityDayLimit ?? STALE_OPPORTUNITY_DAY_LIMIT;
  const isNextStepFieldConfigured = isDefined(
    opportunitySignalFields.nextStepField,
  );
  const lastActivityFieldCandidates = getSignalFieldCandidates({
    fieldTypes: LAST_ACTIVITY_FIELD_TYPES,
    objectMetadataItem: opportunityObjectMetadataItem,
  });
  const nextStepFieldCandidates = getSignalFieldCandidates({
    fieldTypes: NEXT_STEP_FIELD_TYPES,
    objectMetadataItem: opportunityObjectMetadataItem,
  });
  const nextStepDateFieldCandidates = getSignalFieldCandidates({
    fieldTypes: LAST_ACTIVITY_FIELD_TYPES,
    objectMetadataItem: opportunityObjectMetadataItem,
  });
  const opportunitySignalStateByOpportunityId = new Map(
    opportunities.map((opportunity) => [
      opportunity.id,
      getOpportunitySignalState({
        activity: opportunityActivityById[opportunity.id],
        closeDate: opportunity.closeDate,
        isNextStepFieldConfigured,
        mappedLastActivity: getMappedFieldDateValue(
          opportunity,
          opportunitySignalFields.lastActivityField,
        ),
        nextStepFieldValue: getMappedFieldTextValue(
          opportunity,
          opportunitySignalFields.nextStepField,
        ),
        nextStepMappedDate: getMappedFieldDateValue(
          opportunity,
          opportunitySignalFields.nextStepDateField,
        ),
        now: today,
        staleDayLimit: staleOpportunityDayLimit,
        updatedAt: opportunity.updatedAt,
      }),
    ]),
  );
  const getOpportunitySignalStateById = (opportunityId: string) =>
    opportunitySignalStateByOpportunityId.get(opportunityId);
  const getOpportunitySignalReasons = (opportunityId: string) =>
    getOpportunitySignalStateById(opportunityId)?.reasons ?? [];
  // A deal with nothing linked is worth a look, but it should not crowd out the
  // signals that a configured next-step field produces.
  const getOpportunityPriorityReasons = (opportunityId: string) =>
    getOpportunitySignalReasons(opportunityId).filter(
      (reason) => reason !== 'noLinkedNextStep',
    );
  const getSignalReasonSeverity = (
    reason: OpportunitySignalReason,
  ): PrioritySeverity =>
    reason === 'closeDatePassed' || reason === 'nextStepOverdue'
      ? 'critical'
      : 'attention';
  const personalOpportunities = opportunities.filter(
    (opportunity) => opportunity.ownerId === currentWorkspaceMember?.id,
  );
  const isPersonalOpportunityListTruncated =
    personalOpportunities.length >= OPPORTUNITY_LIMIT;
  const stalePersonalOpportunities = personalOpportunities.filter(
    (opportunity) => getOpportunitySignalStateById(opportunity.id)?.isStale,
  );
  const personalOpportunitiesWithoutNextStep = personalOpportunities.filter(
    (opportunity) =>
      getOpportunitySignalStateById(opportunity.id)?.hasNextStep === false,
  );
  const overduePersonalOpportunities = personalOpportunities.filter(
    (opportunity) =>
      isDefined(opportunity.closeDate) &&
      new Date(opportunity.closeDate) < today,
  );
  const personalOpportunitiesClosingThisPeriod = personalOpportunities.filter(
    (opportunity) =>
      isDefined(opportunity.closeDate) &&
      new Date(opportunity.closeDate) >= periodStartsAt &&
      new Date(opportunity.closeDate) <= periodEndsAt,
  );
  const personalOpportunityRiskIds = new Set(
    personalOpportunities
      .filter(
        (opportunity) =>
          getOpportunityPriorityReasons(opportunity.id).length > 0,
      )
      .map((opportunity) => opportunity.id),
  );
  const personalOpportunityRisks = personalOpportunities.filter((opportunity) =>
    personalOpportunityRiskIds.has(opportunity.id),
  );
  const personalPipelineAttentionItems = [...personalOpportunities]
    .sort((first, second) => {
      const firstReasonCount = getOpportunitySignalReasons(first.id).length;
      const secondReasonCount = getOpportunitySignalReasons(second.id).length;

      if (firstReasonCount !== secondReasonCount) {
        return secondReasonCount - firstReasonCount;
      }

      if (!isDefined(first.closeDate)) {
        return 1;
      }
      if (!isDefined(second.closeDate)) {
        return -1;
      }

      return (
        new Date(first.closeDate).getTime() -
        new Date(second.closeDate).getTime()
      );
    })
    .slice(0, 4);
  const opportunityStageOptions =
    objectMetadataItems
      .find(
        (objectMetadataItem) =>
          objectMetadataItem.nameSingular ===
          CoreObjectNameSingular.Opportunity,
      )
      ?.fields.find((fieldMetadataItem) => fieldMetadataItem.name === 'stage')
      ?.options?.filter(({ value }) => value !== 'CUSTOMER') ?? [];
  const opportunityStages =
    opportunityStageOptions.length > 0
      ? opportunityStageOptions.map(({ value }) => value)
      : [...new Set(opportunities.map((opportunity) => opportunity.stage))];
  const personalOpportunityStageCounts = opportunityStages.map((stage) => ({
    count: personalOpportunities.filter(
      (opportunity) => opportunity.stage === stage,
    ).length,
    stage,
  }));
  const largestPersonalStageCount = Math.max(
    1,
    ...personalOpportunityStageCounts.map(({ count }) => count),
  );
  const getOpportunityStageLabel = (stage: string) => {
    return (
      opportunityStageOptions.find(({ value }) => value === stage)?.label ??
      stage
    );
  };
  const teamMemberPerformance = workspaceMembers
    .map((member) => {
      const memberTasks = teamTasks.filter(
        (task) => task.assigneeId === member.id,
      );
      const memberOpportunities = opportunities.filter(
        (opportunity) => opportunity.ownerId === member.id,
      );
      const overdueTaskCount = memberTasks.filter(
        (task) => isDefined(task.dueAt) && new Date(task.dueAt) < new Date(),
      ).length;
      const staleOpportunityCount = memberOpportunities.filter(
        (opportunity) =>
          getOpportunitySignalStateById(opportunity.id)?.isStale === true,
      ).length;
      const missingNextStepCount = memberOpportunities.filter(
        (opportunity) =>
          getOpportunitySignalStateById(opportunity.id)?.hasNextStep === false,
      ).length;
      const overdueOpportunityCount = memberOpportunities.filter(
        (opportunity) =>
          isDefined(opportunity.closeDate) &&
          new Date(opportunity.closeDate) < today,
      ).length;
      const meetingCount = teamPeriodCalendarEvents.filter((calendarEvent) =>
        calendarEvent.calendarEventParticipants.some(
          (participant) => participant.workspaceMemberId === member.id,
        ),
      ).length;
      const isOverCapacity = memberTasks.length > openTaskTarget;
      const attentionSignalCount =
        overdueTaskCount +
        staleOpportunityCount +
        overdueOpportunityCount +
        missingNextStepCount +
        Number(isOverCapacity);

      return {
        attentionSignalCount,
        isOverCapacity,
        meetingCount,
        member,
        missingNextStepCount,
        opportunities: memberOpportunities,
        overdueOpportunityCount,
        overdueTaskCount,
        staleOpportunityCount,
        tasks: memberTasks,
      };
    })
    .sort((first, second) => {
      if (second.attentionSignalCount !== first.attentionSignalCount) {
        return second.attentionSignalCount - first.attentionSignalCount;
      }

      return first.member.name.firstName.localeCompare(
        second.member.name.firstName,
      );
    });
  const teamMembersNeedingAttention = teamMemberPerformance.filter(
    ({ attentionSignalCount }) => attentionSignalCount > 0,
  ).length;
  const visibleTeamMemberCount = Math.min(
    TEAM_MEMBER_VISIBLE_LIMIT,
    teamMemberPerformance.length,
  );
  const visibleCampaignCount = Math.min(
    CAMPAIGN_PREVIEW_LIMIT,
    messageCampaigns.length,
  );
  const teamAttentionTotals = {
    overCapacity: teamMemberPerformance.filter(
      ({ isOverCapacity }) => isOverCapacity,
    ).length,
    overdueOpportunities: teamMemberPerformance.reduce(
      (total, { overdueOpportunityCount }) => total + overdueOpportunityCount,
      0,
    ),
    overdueTasks: teamMemberPerformance.reduce(
      (total, { overdueTaskCount }) => total + overdueTaskCount,
      0,
    ),
    staleOpportunities: teamMemberPerformance.reduce(
      (total, { staleOpportunityCount }) => total + staleOpportunityCount,
      0,
    ),
    withoutNextStep: teamMemberPerformance.reduce(
      (total, { missingNextStepCount }) => total + missingNextStepCount,
      0,
    ),
  };
  const getAttentionReasonLabels = ({
    isOverCapacity,
    missingNextStepCount,
    overdueOpportunityCount,
    overdueTaskCount,
    staleOpportunityCount,
  }: {
    isOverCapacity: boolean;
    missingNextStepCount: number;
    overdueOpportunityCount: number;
    overdueTaskCount: number;
    staleOpportunityCount: number;
  }) =>
    [
      overdueTaskCount > 0 ? t`${overdueTaskCount} overdue tasks` : null,
      staleOpportunityCount > 0
        ? t`${staleOpportunityCount} stalled deals`
        : null,
      missingNextStepCount > 0
        ? t`${missingNextStepCount} without next step`
        : null,
      overdueOpportunityCount > 0
        ? t`${overdueOpportunityCount} past close date`
        : null,
      isOverCapacity ? t`Over task limit` : null,
    ].filter(isDefined);
  const activeCampaigns = messageCampaigns.filter(
    (campaign) =>
      campaign.status === 'SCHEDULED' || campaign.status === 'SENDING',
  );
  const recentCampaigns = messageCampaigns.slice(0, 4);
  const previousCampaigns = messageCampaigns.slice(4, 8);
  const overallDeliveryRate = getDeliveryRate(recentCampaigns);
  const previousDeliveryRate = getDeliveryRate(previousCampaigns);
  const campaignDeliveryDelta = overallDeliveryRate - previousDeliveryRate;
  const hasCampaignDeliveryData = recentCampaigns.some(
    (campaign) => campaign.sentCount > 0,
  );
  const meetingDelta =
    currentPeriodMeetings.length - previousPeriodMeetings.length;
  const currentPeriodManagementMeetings = currentPeriodMeetings.filter(
    (calendarEvent) =>
      calendarEvent.title?.toLocaleLowerCase().includes('management'),
  );
  const currentPeriodAdvisorMeetings = currentPeriodMeetings.filter(
    (calendarEvent) => {
      const normalizedTitle = calendarEvent.title?.toLocaleLowerCase() ?? '';

      return (
        normalizedTitle.includes('advisor') ||
        normalizedTitle.includes('berater')
      );
    },
  );
  const firstName = currentWorkspaceMember?.name.firstName;
  const greeting = isNonEmptyString(firstName)
    ? t`Welcome back, ${firstName}`
    : t`Welcome back`;
  const {
    data: personalOpenTaskCountData,
    loading: isPersonalOpenTaskCountLoading,
  } = useAggregateRecords({
    filter: makeAndFilterVariables([
      isDefined(currentWorkspaceMember)
        ? { assigneeId: { eq: currentWorkspaceMember.id } }
        : undefined,
      { status: { neq: 'DONE' } },
    ]),
    objectNameSingular: CoreObjectNameSingular.Task,
    recordGqlFieldsAggregate: {
      [FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]: [AggregateOperations.COUNT],
    },
    skip: !isDefined(currentWorkspaceMember),
  });
  const {
    data: personalOverdueTaskCountData,
    loading: isPersonalOverdueTaskCountLoading,
  } = useAggregateRecords({
    filter: makeAndFilterVariables([
      isDefined(currentWorkspaceMember)
        ? { assigneeId: { eq: currentWorkspaceMember.id } }
        : undefined,
      { status: { neq: 'DONE' } },
      { dueAt: { lt: todayIsoString } },
    ]),
    objectNameSingular: CoreObjectNameSingular.Task,
    recordGqlFieldsAggregate: {
      [FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]: [AggregateOperations.COUNT],
    },
    skip: !isDefined(currentWorkspaceMember),
  });
  const { data: teamOpenTaskCountData, loading: isTeamOpenTaskCountLoading } =
    useAggregateRecords({
      filter: { status: { neq: 'DONE' } },
      objectNameSingular: CoreObjectNameSingular.Task,
      recordGqlFieldsAggregate: {
        [FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]: [
          AggregateOperations.COUNT,
        ],
      },
    });
  const {
    data: teamOpenOpportunityCountData,
    loading: isTeamOpenOpportunityCountLoading,
  } = useAggregateRecords({
    filter: { stage: { neq: 'CUSTOMER' } },
    objectNameSingular: CoreObjectNameSingular.Opportunity,
    recordGqlFieldsAggregate: {
      [FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION]: [AggregateOperations.COUNT],
    },
  });
  const personalOpenTaskCount = isPersonalOpenTaskCountLoading
    ? tasks.length
    : getAggregatedCount(personalOpenTaskCountData);
  const personalOverdueTaskCount = isPersonalOverdueTaskCountLoading
    ? overdueTasks.length
    : getAggregatedCount(personalOverdueTaskCountData);
  const teamOpenTaskCount = isTeamOpenTaskCountLoading
    ? teamTasks.length
    : getAggregatedCount(teamOpenTaskCountData);
  const teamOpenOpportunityCount = isTeamOpenOpportunityCountLoading
    ? opportunities.length
    : getAggregatedCount(teamOpenOpportunityCountData);
  const isPersonalTaskCountExact = !isPersonalOpenTaskCountLoading;
  const isPersonalOverdueTaskCountExact = !isPersonalOverdueTaskCountLoading;
  const isTeamOpenTaskCountExact = !isTeamOpenTaskCountLoading;
  const isTeamOpenOpportunityCountExact = !isTeamOpenOpportunityCountLoading;
  const isPersonalTaskCountTruncated =
    !isPersonalTaskCountExact && isPersonalTaskListTruncated;
  const isPersonalOverdueTaskCountTruncated =
    !isPersonalOverdueTaskCountExact && isPersonalTaskListTruncated;
  const isTeamOpenTaskCountTruncated =
    !isTeamOpenTaskCountExact && isTeamTaskListTruncated;
  const isTeamOpenOpportunityCountTruncated =
    !isTeamOpenOpportunityCountExact && isOpportunityListTruncated;
  const overdueTaskIds = new Set(overdueTasks.map((task) => task.id));
  const todayTasks = tasks.filter(
    (task) =>
      isDefined(task.dueAt) &&
      isSameDay(new Date(task.dueAt), today) &&
      !overdueTaskIds.has(task.id),
  );
  const campaignsNeedingAttention = messageCampaigns.filter(
    (campaign) =>
      campaign.status === 'SENT_WITH_ERRORS' ||
      campaign.failedCount + campaign.bouncedCount > 0,
  );
  const getSignalReasonLabel = (
    opportunity: TeamOpportunity,
    reason: OpportunitySignalReason,
  ): string => {
    const signalState = getOpportunitySignalStateById(opportunity.id);

    switch (reason) {
      case 'closeDatePassed':
        return isDefined(opportunity.closeDate)
          ? t`Close date passed · ${beautifyExactDate(opportunity.closeDate)}`
          : t`Close date passed`;
      case 'nextStepOverdue':
        return t`Next step overdue`;
      case 'nextStepMissing':
        return t`Next step is empty`;
      case 'noLinkedNextStep':
        return t`No linked task or meeting`;
      case 'stalled':
        return isDefined(signalState?.daysSinceLastActivity)
          ? t`Stalled ${signalState.daysSinceLastActivity} days`
          : t`No recorded activity`;
    }
  };
  const getActivitySourceLabel = (opportunity: TeamOpportunity) => {
    const signalState = getOpportunitySignalStateById(opportunity.id);

    switch (signalState?.lastActivitySource) {
      case 'email':
        return t`last email`;
      case 'mappedField':
        return (
          opportunitySignalFields.lastActivityField?.label ?? t`mapped field`
        );
      case 'meeting':
        return t`last meeting`;
      case 'note':
        return t`last note`;
      case 'task':
        return t`last task update`;
      case 'timelineActivity':
        return t`last timeline activity`;
      case null:
      case undefined:
        return t`no recorded activity`;
    }
  };
  const getOpportunityPrimaryReasonLabel = (opportunity: TeamOpportunity) => {
    const primaryReason = getOpportunitySignalReasons(opportunity.id).at(0);

    return isDefined(primaryReason)
      ? getSignalReasonLabel(opportunity, primaryReason)
      : null;
  };
  const getOpportunityReasonSummary = (opportunity: TeamOpportunity) =>
    getOpportunitySignalReasons(opportunity.id)
      .map((reason) => getSignalReasonLabel(opportunity, reason))
      .join(' · ');
  const getOpportunitySignalTooltip = (opportunity: TeamOpportunity) => {
    const signalState = getOpportunitySignalStateById(opportunity.id);
    const activityLabel = isDefined(signalState?.daysSinceLastActivity)
      ? t`${getActivitySourceLabel(opportunity)}, ${signalState.daysSinceLastActivity} days ago`
      : getActivitySourceLabel(opportunity);

    return `${getOpportunityReasonSummary(opportunity) || t`No open signal`} · ${t`Latest activity`}: ${activityLabel}`;
  };
  const activityWindowDays = getOpportunityActivityWindowDays(
    staleOpportunityDayLimit,
  );
  const lastActivitySourceLabel = isDefined(
    opportunitySignalFields.lastActivityField,
  )
    ? t`Activity from ${opportunitySignalFields.lastActivityField.label}`
    : t`Activity from notes, emails, linked tasks and meetings`;
  const nextStepSourceLabel = isNextStepFieldConfigured
    ? t`Next step from ${opportunitySignalFields.nextStepField?.label}`
    : t`Next step from linked tasks and meetings`;
  const getTimelineSourceLabel = (source: OpportunityActivitySource) => {
    switch (source) {
      case 'email':
        return t`emails`;
      case 'mappedField':
        return t`mapped field`;
      case 'meeting':
        return t`meetings`;
      case 'note':
        return t`notes`;
      case 'task':
        return t`tasks`;
      case 'timelineActivity':
        return t`record events`;
    }
  };
  const timelineSourceSummaryLabel = Object.entries(
    opportunityActivityDiagnostics.timelineSourceSummaries,
  )
    .map(([source, summary]) => ({
      count: summary?.count ?? 0,
      label: getTimelineSourceLabel(source as OpportunityActivitySource),
    }))
    .sort((first, second) => second.count - first.count)
    .map(({ count, label }) => `${label} ${count}`)
    .join(' · ');
  const personalPriorityItems: PriorityItem[] = [
    ...overdueTasks.map((task) => ({
      category: 'tasks' as const,
      id: `overdue-${task.id}`,
      severity: 'critical' as const,
      sortKey: isDefined(task.dueAt)
        ? new Date(task.dueAt).getTime()
        : Number.MAX_SAFE_INTEGER,
      weight: PRIORITY_WEIGHT.overdueTask,
      icon: <IconAlertTriangle size={theme.icon.size.md} />,
      meta: isDefined(task.dueAt)
        ? t`Overdue · ${beautifyExactDate(task.dueAt)}`
        : t`Overdue`,
      title: task.title || t`Untitled task`,
      to: getAppPath(AppPath.RecordShowPage, {
        objectNameSingular: CoreObjectNameSingular.Task,
        objectRecordId: task.id,
      }),
    })),
    ...personalOpportunityRisks.map((opportunity) => ({
      category: 'deals' as const,
      id: `opportunity-risk-${opportunity.id}`,
      severity: getSignalReasonSeverity(
        getOpportunityPriorityReasons(opportunity.id).at(0) ?? 'stalled',
      ),
      sortKey: isDefined(opportunity.closeDate)
        ? new Date(opportunity.closeDate).getTime()
        : new Date(opportunity.updatedAt).getTime(),
      weight: PRIORITY_WEIGHT.dealRisk,
      icon: <IconCurrencyDollar size={theme.icon.size.md} />,
      meta: getOpportunityPrimaryReasonLabel(opportunity) ?? t`Needs attention`,
      title: opportunity.name || t`Untitled opportunity`,
      to: getAppPath(AppPath.RecordShowPage, {
        objectNameSingular: CoreObjectNameSingular.Opportunity,
        objectRecordId: opportunity.id,
      }),
    })),
    ...campaignsNeedingAttention.map((campaign) => ({
      category: 'campaigns' as const,
      id: `campaign-${campaign.id}`,
      severity: 'attention' as const,
      sortKey: 0,
      weight: PRIORITY_WEIGHT.campaignIssue,
      icon: <IconMail size={theme.icon.size.md} />,
      meta: t`${campaign.failedCount + campaign.bouncedCount} failed or bounced`,
      title: campaign.name,
      to: getAppPath(AppPath.RecordShowPage, {
        objectNameSingular: CoreObjectNameSingular.MessageCampaign,
        objectRecordId: campaign.id,
      }),
    })),
    ...todayTasks.map((task) => ({
      category: 'tasks' as const,
      id: `today-${task.id}`,
      severity: 'attention' as const,
      sortKey: isDefined(task.dueAt)
        ? new Date(task.dueAt).getTime()
        : Number.MAX_SAFE_INTEGER,
      weight: PRIORITY_WEIGHT.dueToday,
      icon: <IconCheckbox size={theme.icon.size.md} />,
      meta: t`Due today`,
      title: task.title || t`Untitled task`,
      to: getAppPath(AppPath.RecordShowPage, {
        objectNameSingular: CoreObjectNameSingular.Task,
        objectRecordId: task.id,
      }),
    })),
    ...meetings.map((meeting) => ({
      category: 'meetings' as const,
      id: `meeting-${meeting.id}`,
      severity: 'info' as const,
      sortKey: isDefined(meeting.startsAt)
        ? new Date(meeting.startsAt).getTime()
        : Number.MAX_SAFE_INTEGER,
      weight: PRIORITY_WEIGHT.meeting,
      icon: <IconCalendarEvent size={theme.icon.size.md} />,
      meta: isDefined(meeting.startsAt)
        ? format(new Date(meeting.startsAt), 'HH:mm')
        : t`Today`,
      title: meeting.title || t`Untitled meeting`,
      to: getAppPath(AppPath.RecordShowPage, {
        objectNameSingular: CoreObjectNameSingular.CalendarEvent,
        objectRecordId: meeting.id,
      }),
    })),
  ];
  const teamOverdueTasks = teamTasks.filter(
    (task) => isDefined(task.dueAt) && new Date(task.dueAt) < today,
  );
  const teamOpportunityRisks = opportunities.filter(
    (opportunity) =>
      isDefined(opportunity.ownerId) &&
      getOpportunityPriorityReasons(opportunity.id).length > 0,
  );
  const teamPriorityItems: PriorityItem[] = [
    ...teamOverdueTasks.map((task) => ({
      category: 'tasks' as const,
      id: `team-overdue-${task.id}`,
      severity: 'critical' as const,
      sortKey: isDefined(task.dueAt)
        ? new Date(task.dueAt).getTime()
        : Number.MAX_SAFE_INTEGER,
      weight: PRIORITY_WEIGHT.overdueTask,
      icon: <IconAlertTriangle size={theme.icon.size.md} />,
      meta: isDefined(task.assignee)
        ? t`Overdue · ${task.assignee.name.firstName} ${task.assignee.name.lastName}`
        : t`Overdue · Unassigned`,
      title: task.title || t`Untitled task`,
      to: getAppPath(AppPath.RecordShowPage, {
        objectNameSingular: CoreObjectNameSingular.Task,
        objectRecordId: task.id,
      }),
    })),
    ...teamOpportunityRisks.map((opportunity) => ({
      category: 'deals' as const,
      id: `team-opportunity-risk-${opportunity.id}`,
      severity: getSignalReasonSeverity(
        getOpportunityPriorityReasons(opportunity.id).at(0) ?? 'stalled',
      ),
      sortKey: isDefined(opportunity.closeDate)
        ? new Date(opportunity.closeDate).getTime()
        : new Date(opportunity.updatedAt).getTime(),
      weight: PRIORITY_WEIGHT.dealRisk,
      icon: <IconCurrencyDollar size={theme.icon.size.md} />,
      meta: getOpportunityPrimaryReasonLabel(opportunity) ?? t`Needs attention`,
      title: opportunity.name || t`Untitled opportunity`,
      to: getAppPath(AppPath.RecordShowPage, {
        objectNameSingular: CoreObjectNameSingular.Opportunity,
        objectRecordId: opportunity.id,
      }),
    })),
    ...campaignsNeedingAttention.map((campaign) => ({
      category: 'campaigns' as const,
      id: `team-campaign-${campaign.id}`,
      severity: 'attention' as const,
      sortKey: 0,
      weight: PRIORITY_WEIGHT.campaignIssue,
      icon: <IconMail size={theme.icon.size.md} />,
      meta: t`${campaign.failedCount + campaign.bouncedCount} failed or bounced`,
      title: campaign.name,
      to: getAppPath(AppPath.RecordShowPage, {
        objectNameSingular: CoreObjectNameSingular.MessageCampaign,
        objectRecordId: campaign.id,
      }),
    })),
  ];
  const allPriorityItems =
    dashboardView === 'team' ? teamPriorityItems : personalPriorityItems;
  const sortedPriorityItems = [...allPriorityItems].sort(
    (first, second) =>
      first.weight - second.weight || first.sortKey - second.sortKey,
  );
  const filteredPriorityItems =
    priorityFilter === 'all'
      ? sortedPriorityItems
      : sortedPriorityItems.filter(
          (priorityItem) => priorityItem.category === priorityFilter,
        );
  const priorityItems = isPriorityListExpanded
    ? filteredPriorityItems
    : filteredPriorityItems.slice(0, PRIORITY_ITEM_LIMIT);
  const priorityCountByCategory: Record<'all' | PriorityCategory, number> = {
    all: sortedPriorityItems.length,
    campaigns: sortedPriorityItems.filter(
      (priorityItem) => priorityItem.category === 'campaigns',
    ).length,
    deals: sortedPriorityItems.filter(
      (priorityItem) => priorityItem.category === 'deals',
    ).length,
    meetings: sortedPriorityItems.filter(
      (priorityItem) => priorityItem.category === 'meetings',
    ).length,
    tasks: sortedPriorityItems.filter(
      (priorityItem) => priorityItem.category === 'tasks',
    ).length,
  };
  const priorityFilters: Array<{
    id: 'all' | PriorityCategory;
    label: string;
  }> = [
    { id: 'all' as const, label: t`All` },
    { id: 'tasks' as const, label: t`Tasks` },
    { id: 'deals' as const, label: t`Deals` },
    { id: 'campaigns' as const, label: t`Campaigns` },
    { id: 'meetings' as const, label: t`Meetings` },
  ];
  const isDashboardRefreshing =
    areCalendarEventsLoading ||
    areMessageCampaignsLoading ||
    areOpportunitiesLoading ||
    areTasksLoading ||
    areTeamTasksLoading ||
    areWorkspaceMembersLoading;
  const widgetLabels: Record<HomeWidgetId, string> = {
    ai: t`AI assistant`,
    meetings: t`Today's meetings`,
    tasks: t`My open tasks`,
    'quick-access': t`Quick access`,
    'recent-views': t`Recent views`,
  };

  const toggleWidget = (widgetId: HomeWidgetId) =>
    updateHomePagePreferences((current) => ({
      ...current,
      hiddenWidgetIds: current.hiddenWidgetIds.includes(widgetId)
        ? current.hiddenWidgetIds.filter((id) => id !== widgetId)
        : [...current.hiddenWidgetIds, widgetId],
    }));
  const moveWidget = (widgetId: HomeWidgetId, offset: -1 | 1) =>
    updateHomePagePreferences((current) => {
      if (widgetId === 'ai') {
        return current;
      }
      const movableWidgetOrder = current.widgetOrder.filter(
        (orderedWidgetId) => orderedWidgetId !== 'ai',
      );
      const currentIndex = movableWidgetOrder.indexOf(widgetId);
      const nextIndex = currentIndex + offset;
      if (nextIndex < 0 || nextIndex >= movableWidgetOrder.length) {
        return current;
      }
      [movableWidgetOrder[currentIndex], movableWidgetOrder[nextIndex]] = [
        movableWidgetOrder[nextIndex],
        movableWidgetOrder[currentIndex],
      ];
      return { ...current, widgetOrder: ['ai', ...movableWidgetOrder] };
    });
  const updateSignalFieldSettings = (
    updates: Partial<HomeSignalFieldSettings>,
  ) =>
    updateHomePagePreferences((current) => {
      const objectMetadataId = opportunityObjectMetadataItem?.id;

      if (!isDefined(objectMetadataId)) {
        return current;
      }

      const currentSettings = current.signalFieldSettings;
      const baseSettings: HomeSignalFieldSettings =
        isDefined(currentSettings) &&
        currentSettings.objectMetadataId === objectMetadataId
          ? currentSettings
          : {
              lastActivityFieldMetadataId: null,
              nextStepDateFieldMetadataId: null,
              nextStepFieldMetadataId: null,
              objectMetadataId,
            };

      return {
        ...current,
        signalFieldSettings: {
          ...baseSettings,
          ...updates,
          objectMetadataId,
        },
      };
    });
  const moveWidgetBefore = (
    sourceWidgetId: HomeWidgetId,
    targetWidgetId: HomeWidgetId,
  ) =>
    updateHomePagePreferences((current) => {
      if (sourceWidgetId === 'ai' || targetWidgetId === 'ai') {
        return current;
      }
      const movableWidgetOrder = current.widgetOrder.filter(
        (widgetId) => widgetId !== 'ai' && widgetId !== sourceWidgetId,
      );
      const targetIndex = movableWidgetOrder.indexOf(targetWidgetId);
      movableWidgetOrder.splice(targetIndex, 0, sourceWidgetId);

      return { ...current, widgetOrder: ['ai', ...movableWidgetOrder] };
    });

  const addCustomDashboardWidget = () =>
    updateHomePagePreferences((current) => {
      const defaultObjectMetadataItem =
        readableObjects.find(
          (item) => item.nameSingular === CoreObjectNameSingular.Task,
        ) ?? readableObjects[0];
      if (!isDefined(defaultObjectMetadataItem)) {
        return current;
      }

      const nextWidgets = [
        ...customDashboardWidgets,
        {
          aggregateOperation: AggregateOperations.COUNT,
          dateFieldMetadataId: null,
          displayType: 'kpi',
          fieldMetadataId: null,
          id: `custom-${Date.now()}`,
          objectMetadataId: defaultObjectMetadataItem.id,
          scope: dashboardView === 'personal' ? 'personal' : 'team',
          target: null,
          title: dashboardView === 'personal' ? t`My records` : t`Team records`,
        } satisfies HomeDashboardWidget,
      ];

      return dashboardView === 'personal'
        ? { ...current, personalDashboardWidgets: nextWidgets }
        : { ...current, teamDashboardWidgets: nextWidgets };
    });
  const updateCustomDashboardWidget = (
    widgetId: string,
    updates: Partial<HomeDashboardWidget>,
  ) =>
    updateHomePagePreferences((current) => {
      const nextWidgets = customDashboardWidgets.map((widget) =>
        widget.id === widgetId ? { ...widget, ...updates } : widget,
      );

      return dashboardView === 'personal'
        ? { ...current, personalDashboardWidgets: nextWidgets }
        : { ...current, teamDashboardWidgets: nextWidgets };
    });
  const removeCustomDashboardWidget = (widgetId: string) =>
    updateHomePagePreferences((current) => {
      const nextWidgets = customDashboardWidgets.filter(
        (widget) => widget.id !== widgetId,
      );

      return dashboardView === 'personal'
        ? { ...current, personalDashboardWidgets: nextWidgets }
        : { ...current, teamDashboardWidgets: nextWidgets };
    });
  const moveCustomDashboardWidget = (widgetId: string, offset: -1 | 1) =>
    updateHomePagePreferences((current) => {
      const currentIndex = customDashboardWidgets.findIndex(
        (widget) => widget.id === widgetId,
      );
      const nextIndex = currentIndex + offset;
      if (
        currentIndex < 0 ||
        nextIndex < 0 ||
        nextIndex >= customDashboardWidgets.length
      ) {
        return current;
      }

      const nextWidgets = [...customDashboardWidgets];
      [nextWidgets[currentIndex], nextWidgets[nextIndex]] = [
        nextWidgets[nextIndex],
        nextWidgets[currentIndex],
      ];

      return dashboardView === 'personal'
        ? { ...current, personalDashboardWidgets: nextWidgets }
        : { ...current, teamDashboardWidgets: nextWidgets };
    });
  const resetCustomDashboardWidgets = () =>
    updateHomePagePreferences((current) =>
      dashboardView === 'personal'
        ? { ...current, personalDashboardWidgets: [] }
        : { ...current, teamDashboardWidgets: [] },
    );

  const aiQuickActions = [
    {
      label: t`Summarize my priorities`,
      prompt: t`Summarize my most important priorities from the visible CRM data for the current ${dashboardPeriod}. Focus on overdue tasks, meetings, and opportunities that need attention.`,
    },
    {
      label: t`Review deals at risk`,
      prompt: t`Review the visible opportunities for the current ${dashboardPeriod}. Identify deals with overdue close dates or stale activity and recommend the next action for each.`,
    },
    {
      label: t`Analyze campaigns`,
      prompt: t`Analyze the visible campaign data for the current ${dashboardPeriod}. Separate technical delivery performance from business outcomes and clearly mark unavailable data.`,
    },
    {
      label: t`Prepare management meeting`,
      prompt: t`Prepare a concise management meeting briefing for the current ${dashboardPeriod} using the visible CRM data. Cover priorities, team workload, pipeline risks, and campaign status.`,
    },
  ];
  const handleAiQuickAction = (prompt: string) => {
    stageAiChatPreprompt({
      draftKey: currentAiChatThread ?? AGENT_CHAT_NEW_THREAD_DRAFT_KEY,
      mode: 'PREFILL',
      text: prompt,
    });
  };

  const widgetContent: Record<HomeWidgetId, ReactNode> = {
    ai: hasAiPermission ? (
      <StyledAiContent>
        <StyledAiQuickActions aria-label={t`AI dashboard actions`}>
          {aiQuickActions.map((action) => (
            <StyledButton
              key={action.label}
              onClick={() => handleAiQuickAction(action.prompt)}
              type="button"
            >
              {action.label}
            </StyledButton>
          ))}
        </StyledAiQuickActions>
        <StyledAiChatContainer>
          <AiChatSurfaceContext.Provider value={AI_CHAT_SURFACE.PAGE}>
            <AiChatTab />
          </AiChatSurfaceContext.Provider>
        </StyledAiChatContainer>
      </StyledAiContent>
    ) : null,
    meetings: (
      <StyledSection>
        <StyledSectionHeading>
          <StyledSectionTitle>{t`Today's meetings`}</StyledSectionTitle>
          <StyledSmallMutedText>
            {areCalendarEventsLoading
              ? t`Loading…`
              : t`${meetings.length} today`}
          </StyledSmallMutedText>
        </StyledSectionHeading>
        <StyledCard>
          {areCalendarEventsLoading ? (
            <StyledEmptyState>{t`Loading meetings…`}</StyledEmptyState>
          ) : meetings.length === 0 ? (
            <StyledEmptyState>
              <IconCalendarEvent size={theme.icon.size.lg} />
              <span>{t`No meetings scheduled for today.`}</span>
              {isDefined(calendarIndexPath) && (
                <StyledSectionLink to={calendarIndexPath}>
                  {t`Open calendar`}{' '}
                  <IconArrowRight size={theme.icon.size.sm} />
                </StyledSectionLink>
              )}
            </StyledEmptyState>
          ) : (
            meetings.slice(0, HOME_ITEM_LIMIT).map((meeting) => (
              <StyledRecordLink
                key={meeting.id}
                to={getAppPath(AppPath.RecordShowPage, {
                  objectNameSingular: CoreObjectNameSingular.CalendarEvent,
                  objectRecordId: meeting.id,
                })}
              >
                <IconCalendarEvent size={theme.icon.size.md} />
                <StyledRecordTitle>
                  {meeting.title || t`Untitled meeting`}
                </StyledRecordTitle>
                {isDefined(meeting.startsAt) && (
                  <StyledRecordMeta>
                    {meeting.isFullDay
                      ? t`All day`
                      : format(new Date(meeting.startsAt), 'HH:mm')}
                  </StyledRecordMeta>
                )}
              </StyledRecordLink>
            ))
          )}
        </StyledCard>
      </StyledSection>
    ),
    tasks: (
      <StyledSection>
        <StyledSectionHeading>
          <StyledSectionTitle>
            {t`My open tasks`}{' '}
            <StyledSmallMutedText>
              {areTasksLoading
                ? t`Loading…`
                : isPersonalTaskCountTruncated
                  ? t`${personalOpenTaskCount}+ open`
                  : t`${personalOpenTaskCount} open`}
            </StyledSmallMutedText>
          </StyledSectionTitle>
          <StyledSectionLink to={AppPath.TasksPage}>
            {t`View all`} <IconArrowRight size={theme.icon.size.sm} />
          </StyledSectionLink>
        </StyledSectionHeading>
        <StyledCard>
          {areTasksLoading ? (
            <StyledEmptyState>{t`Loading tasks…`}</StyledEmptyState>
          ) : tasks.length === 0 ? (
            <StyledEmptyState>
              <IconCheckbox size={theme.icon.size.lg} />
              <span>{t`You are all caught up.`}</span>
              {isDefined(tasksIndexPath) && (
                <StyledSectionLink to={tasksIndexPath}>
                  {t`Open tasks`} <IconArrowRight size={theme.icon.size.sm} />
                </StyledSectionLink>
              )}
            </StyledEmptyState>
          ) : (
            tasks.slice(0, HOME_ITEM_LIMIT).map((task) => (
              <StyledRecordLink
                key={task.id}
                to={getAppPath(AppPath.RecordShowPage, {
                  objectNameSingular: CoreObjectNameSingular.Task,
                  objectRecordId: task.id,
                })}
              >
                <IconCheckbox size={theme.icon.size.md} />
                <StyledRecordTitle>
                  {task.title || t`Untitled task`}
                </StyledRecordTitle>
                {isDefined(task.dueAt) && (
                  <StyledRecordMeta
                    isOverdue={overdueTasks.some((item) => item.id === task.id)}
                  >
                    <IconClock size={theme.icon.size.sm} />
                    {beautifyExactDate(task.dueAt)}
                  </StyledRecordMeta>
                )}
              </StyledRecordLink>
            ))
          )}
        </StyledCard>
      </StyledSection>
    ),
    'quick-access': (
      <StyledSection>
        <StyledSectionTitle>{t`Quick access`}</StyledSectionTitle>
        <StyledCard>
          <StyledShortcutGrid>
            {shortcutObjects.map((objectMetadataItem) => (
              <StyledShortcutLink
                key={objectMetadataItem.id}
                to={getAppPath(AppPath.RecordIndexPage, {
                  objectNamePlural: objectMetadataItem.namePlural,
                })}
              >
                <ObjectMetadataIcon objectMetadataItem={objectMetadataItem} />
                <StyledTruncatedText>
                  {objectMetadataItem.labelPlural}
                </StyledTruncatedText>
              </StyledShortcutLink>
            ))}
          </StyledShortcutGrid>
        </StyledCard>
      </StyledSection>
    ),
    'recent-views':
      recentViews.length > 0 ? (
        <StyledSection>
          <StyledSectionTitle>{t`Continue where you left off`}</StyledSectionTitle>
          <StyledViewGrid>
            {recentViews.map(({ objectMetadataItem, view }) => (
              <StyledViewLink
                key={view.id}
                to={getAppPath(
                  AppPath.RecordIndexPage,
                  { objectNamePlural: objectMetadataItem.namePlural },
                  { viewId: view.id },
                )}
              >
                <ObjectMetadataIcon objectMetadataItem={objectMetadataItem} />
                <StyledViewText>
                  <StyledTruncatedText>{view.name}</StyledTruncatedText>
                  <StyledSmallMutedText>
                    {objectMetadataItem.labelPlural}
                  </StyledSmallMutedText>
                </StyledViewText>
                <IconArrowRight size={theme.icon.size.sm} />
              </StyledViewLink>
            ))}
          </StyledViewGrid>
        </StyledSection>
      ) : null,
  };
  const isAiUnavailable = !hasAiPermission;
  const isAiHidden =
    homePagePreferences.hiddenWidgetIds.includes('ai') || isAiUnavailable;
  const movableWidgetOrder = homePagePreferences.widgetOrder.filter(
    (widgetId) => widgetId !== 'ai',
  );

  return (
    <PageCardLayout header={<PageHeader title={t`Home`} Icon={IconHome} />}>
      <PageTitle title={t`Home`} />
      <StyledContent>
        <StyledGreetingRow>
          <StyledGreeting>
            <StyledGreetingTitle>{greeting}</StyledGreetingTitle>
            <StyledMutedText>
              {t`${overdueTasks.length} overdue tasks · ${meetings.length} meetings today`}
            </StyledMutedText>
          </StyledGreeting>
          <StyledButton
            active={isCustomizing}
            onClick={() => setIsCustomizing((value) => !value)}
            type="button"
          >
            <IconSettings size={theme.icon.size.sm} />
            {isCustomizing ? t`Done` : t`Dashboard settings`}
          </StyledButton>
        </StyledGreetingRow>

        {isCustomizing && (
          <StyledPreferences>
            <StyledPreferencesHeader>
              <StyledPanelTitle>
                {dashboardView === 'personal'
                  ? t`Personal dashboard settings`
                  : t`Team dashboard settings`}
              </StyledPanelTitle>
              <StyledButton
                onClick={() => setIsCustomizing(false)}
                type="button"
              >
                {t`Done`}
              </StyledButton>
            </StyledPreferencesHeader>
            <StyledPreferenceRow>
              <StyledPreferenceTarget>
                {t`Weekly meetings`}
                <StyledPreferenceInput
                  aria-label={t`Weekly meeting target`}
                  min={1}
                  onChange={(event) =>
                    updateHomePagePreferences((current) => ({
                      ...current,
                      ...(dashboardView === 'personal'
                        ? {
                            weeklyMeetingTarget: Math.max(
                              1,
                              Number(event.target.value),
                            ),
                          }
                        : {
                            teamWeeklyMeetingTarget: Math.max(
                              1,
                              Number(event.target.value),
                            ),
                          }),
                    }))
                  }
                  type="number"
                  value={weeklyMeetingTarget}
                />
              </StyledPreferenceTarget>
              <StyledPreferenceTarget>
                {t`Maximum open tasks`}
                <StyledPreferenceInput
                  aria-label={t`Maximum open task target`}
                  min={1}
                  onChange={(event) =>
                    updateHomePagePreferences((current) => ({
                      ...current,
                      ...(dashboardView === 'personal'
                        ? {
                            openTaskTarget: Math.max(
                              1,
                              Number(event.target.value),
                            ),
                          }
                        : {
                            teamOpenTaskTarget: Math.max(
                              1,
                              Number(event.target.value),
                            ),
                          }),
                    }))
                  }
                  type="number"
                  value={openTaskTarget}
                />
              </StyledPreferenceTarget>
              <StyledPreferenceTarget>
                {t`Delivery rate`}
                <StyledPreferenceInput
                  aria-label={t`Campaign delivery rate target`}
                  max={100}
                  min={1}
                  onChange={(event) =>
                    updateHomePagePreferences((current) => ({
                      ...current,
                      ...(dashboardView === 'personal'
                        ? {
                            deliveryRateTarget: Math.min(
                              100,
                              Math.max(1, Number(event.target.value)),
                            ),
                          }
                        : {
                            teamDeliveryRateTarget: Math.min(
                              100,
                              Math.max(1, Number(event.target.value)),
                            ),
                          }),
                    }))
                  }
                  type="number"
                  value={deliveryRateTarget}
                />
              </StyledPreferenceTarget>
            </StyledPreferenceRow>
            <StyledPreferenceRow>
              <StyledPreferenceLabel>{t`Start page`}</StyledPreferenceLabel>
              {([AppPath.Home, INBOX_PATH] as const).map((startPage) => (
                <StyledButton
                  key={startPage}
                  active={homePagePreferences.startPage === startPage}
                  onClick={() =>
                    updateHomePagePreferences((current) => ({
                      ...current,
                      startPage,
                    }))
                  }
                  type="button"
                >
                  {startPage === AppPath.Home ? t`Home` : t`Inbox`}
                </StyledButton>
              ))}
              <StyledPreferenceLabel>{t`Default view`}</StyledPreferenceLabel>
              {(hasTeamDashboardPermission
                ? (['personal', 'team'] as const)
                : (['personal'] as const)
              ).map((preferredView) => (
                <StyledButton
                  key={preferredView}
                  active={dashboardView === preferredView}
                  onClick={() =>
                    updateHomePagePreferences((current) => ({
                      ...current,
                      dashboardView: preferredView,
                    }))
                  }
                  type="button"
                >
                  {preferredView === 'personal' ? t`For me` : t`Team`}
                </StyledButton>
              ))}
              <StyledPreferenceLabel>{t`Default period`}</StyledPreferenceLabel>
              {(['week', 'month'] as const).map((preferredPeriod) => (
                <StyledButton
                  key={preferredPeriod}
                  active={dashboardPeriod === preferredPeriod}
                  onClick={() =>
                    updateHomePagePreferences((current) => ({
                      ...current,
                      dashboardPeriod: preferredPeriod,
                    }))
                  }
                  type="button"
                >
                  {preferredPeriod === 'week' ? t`Week` : t`Month`}
                </StyledButton>
              ))}
            </StyledPreferenceRow>
            <StyledPreferenceRow>
              <StyledPreferenceLabel>{t`Custom dashboard widgets`}</StyledPreferenceLabel>
              <StyledButton onClick={addCustomDashboardWidget} type="button">
                <IconPlus size={theme.icon.size.sm} />
                {t`Add widget`}
              </StyledButton>
              <StyledButton
                disabled={customDashboardWidgets.length === 0}
                onClick={resetCustomDashboardWidgets}
                type="button"
              >
                {t`Reset widgets`}
              </StyledButton>
            </StyledPreferenceRow>
            <StyledCustomWidgetList>
              {customDashboardWidgets.map((widget, widgetIndex) => {
                const objectMetadataItem = readableObjects.find(
                  (item) => item.id === widget.objectMetadataId,
                );
                const selectableFields =
                  objectMetadataItem?.readableFields.filter(
                    (fieldMetadataItem) =>
                      fieldMetadataItem.isActive !== false &&
                      !isHiddenSystemField(fieldMetadataItem),
                  ) ?? [];
                const selectedFieldMetadataItem = selectableFields.find(
                  (fieldMetadataItem) =>
                    fieldMetadataItem.id === widget.fieldMetadataId,
                );
                const aggregateFieldName = isDefined(selectedFieldMetadataItem)
                  ? selectedFieldMetadataItem.name
                  : FIELD_FOR_TOTAL_COUNT_AGGREGATE_OPERATION;
                const aggregateOperations = isDefined(objectMetadataItem)
                  ? getWidgetAggregateOperations({
                      fieldName: aggregateFieldName,
                      objectMetadataItem,
                    })
                  : [];
                const dateFields = selectableFields.filter(
                  (fieldMetadataItem) =>
                    fieldMetadataItem.type === FieldMetadataType.DATE ||
                    fieldMetadataItem.type === FieldMetadataType.DATE_TIME,
                );
                const filterFields = selectableFields.filter(
                  (fieldMetadataItem) =>
                    fieldMetadataItem.type === FieldMetadataType.SELECT ||
                    fieldMetadataItem.type === FieldMetadataType.BOOLEAN,
                );
                const selectedFilterFieldMetadataItem = filterFields.find(
                  (fieldMetadataItem) =>
                    fieldMetadataItem.id === widget.filterFieldMetadataId,
                );
                const personalScopeAvailable =
                  isDefined(objectMetadataItem) &&
                  isDefined(getPersonalScopeFieldName(objectMetadataItem));

                return (
                  <StyledCustomWidgetEditor key={widget.id}>
                    <StyledCustomWidgetTitleInput
                      aria-label={t`Widget title`}
                      onChange={(event) =>
                        updateCustomDashboardWidget(widget.id, {
                          title: event.target.value,
                        })
                      }
                      type="text"
                      value={widget.title}
                    />
                    <StyledPreferenceSelect
                      aria-label={t`Widget object`}
                      onChange={(event) => {
                        updateCustomDashboardWidget(widget.id, {
                          aggregateOperation: AggregateOperations.COUNT,
                          dateFieldMetadataId: null,
                          displayType: 'kpi',
                          fieldMetadataId: null,
                          filterFieldMetadataId: null,
                          filterValue: null,
                          objectMetadataId: event.target.value,
                          scope:
                            dashboardView === 'personal' ? 'personal' : 'team',
                        });
                      }}
                      value={widget.objectMetadataId}
                    >
                      {!isDefined(objectMetadataItem) && (
                        <option value={widget.objectMetadataId}>
                          {t`Object no longer available`}
                        </option>
                      )}
                      {readableObjects.map((readableObject) => (
                        <option
                          key={readableObject.id}
                          value={readableObject.id}
                        >
                          {readableObject.labelPlural}
                        </option>
                      ))}
                    </StyledPreferenceSelect>
                    <StyledPreferenceSelect
                      aria-label={t`Widget field`}
                      onChange={(event) => {
                        const fieldMetadataId =
                          event.target.value === '__records__'
                            ? null
                            : event.target.value;
                        updateCustomDashboardWidget(widget.id, {
                          aggregateOperation: AggregateOperations.COUNT,
                          displayType: 'kpi',
                          fieldMetadataId,
                        });
                      }}
                      value={widget.fieldMetadataId ?? '__records__'}
                    >
                      <option value="__records__">{t`All records`}</option>
                      {selectableFields.map((fieldMetadataItem) => (
                        <option
                          key={fieldMetadataItem.id}
                          value={fieldMetadataItem.id}
                        >
                          {fieldMetadataItem.label}
                        </option>
                      ))}
                    </StyledPreferenceSelect>
                    <StyledPreferenceSelect
                      aria-label={t`Widget display`}
                      onChange={(event) =>
                        updateCustomDashboardWidget(widget.id, {
                          displayType: event.target.value as
                            | 'distribution'
                            | 'kpi',
                        })
                      }
                      value={widget.displayType ?? 'kpi'}
                    >
                      <option value="kpi">{t`KPI card`}</option>
                      {selectedFieldMetadataItem?.type ===
                        FieldMetadataType.SELECT && (
                        <option value="distribution">
                          {t`Horizontal distribution`}
                        </option>
                      )}
                    </StyledPreferenceSelect>
                    <StyledPreferenceSelect
                      aria-label={t`Widget aggregation`}
                      onChange={(event) =>
                        updateCustomDashboardWidget(widget.id, {
                          aggregateOperation: event.target
                            .value as HomeDashboardWidget['aggregateOperation'],
                        })
                      }
                      value={
                        widget.aggregateOperation ?? AggregateOperations.COUNT
                      }
                    >
                      {aggregateOperations.map((aggregateOperation) => (
                        <option
                          key={aggregateOperation}
                          value={aggregateOperation}
                        >
                          {getAggregateOperationLabel(aggregateOperation)}
                        </option>
                      ))}
                    </StyledPreferenceSelect>
                    <StyledPreferenceSelect
                      aria-label={t`Widget period field`}
                      onChange={(event) =>
                        updateCustomDashboardWidget(widget.id, {
                          dateFieldMetadataId: event.target.value || null,
                        })
                      }
                      value={widget.dateFieldMetadataId ?? ''}
                    >
                      <option value="">{t`All time`}</option>
                      {dateFields.map((fieldMetadataItem) => (
                        <option
                          key={fieldMetadataItem.id}
                          value={fieldMetadataItem.id}
                        >
                          {t`Current period by ${fieldMetadataItem.label}`}
                        </option>
                      ))}
                    </StyledPreferenceSelect>
                    <StyledPreferenceSelect
                      aria-label={t`Widget scope`}
                      onChange={(event) =>
                        updateCustomDashboardWidget(widget.id, {
                          scope: event.target.value as 'personal' | 'team',
                        })
                      }
                      value={widget.scope ?? dashboardView}
                    >
                      <option
                        disabled={!personalScopeAvailable}
                        value="personal"
                      >
                        {t`My records`}
                      </option>
                      <option value="team">{t`All visible records`}</option>
                    </StyledPreferenceSelect>
                    <StyledPreferenceSelect
                      aria-label={t`Widget filter field`}
                      onChange={(event) =>
                        updateCustomDashboardWidget(widget.id, {
                          filterFieldMetadataId: event.target.value || null,
                          filterValue: null,
                        })
                      }
                      value={widget.filterFieldMetadataId ?? ''}
                    >
                      <option value="">{t`No field filter`}</option>
                      {filterFields.map((fieldMetadataItem) => (
                        <option
                          key={fieldMetadataItem.id}
                          value={fieldMetadataItem.id}
                        >
                          {fieldMetadataItem.label}
                        </option>
                      ))}
                    </StyledPreferenceSelect>
                    {isDefined(selectedFilterFieldMetadataItem) && (
                      <StyledPreferenceSelect
                        aria-label={t`Widget filter value`}
                        onChange={(event) =>
                          updateCustomDashboardWidget(widget.id, {
                            filterValue:
                              selectedFilterFieldMetadataItem.type ===
                              FieldMetadataType.BOOLEAN
                                ? event.target.value === 'true'
                                : event.target.value || null,
                          })
                        }
                        value={
                          isDefined(widget.filterValue)
                            ? String(widget.filterValue)
                            : ''
                        }
                      >
                        <option value="">{t`Choose value`}</option>
                        {selectedFilterFieldMetadataItem.type ===
                        FieldMetadataType.BOOLEAN ? (
                          <>
                            <option value="true">{t`True`}</option>
                            <option value="false">{t`False`}</option>
                          </>
                        ) : (
                          selectedFilterFieldMetadataItem.options?.map(
                            (option) => (
                              <option key={option.id} value={option.value}>
                                {option.label}
                              </option>
                            ),
                          )
                        )}
                      </StyledPreferenceSelect>
                    )}
                    <StyledPreferenceInput
                      aria-label={t`Widget target`}
                      min={1}
                      onChange={(event) =>
                        updateCustomDashboardWidget(widget.id, {
                          target:
                            event.target.value === ''
                              ? null
                              : Math.max(1, Number(event.target.value)),
                        })
                      }
                      placeholder={t`Target`}
                      type="number"
                      value={widget.target ?? ''}
                    />
                    <StyledButton
                      active={!widget.isHidden}
                      aria-label={t`Toggle widget visibility`}
                      onClick={() =>
                        updateCustomDashboardWidget(widget.id, {
                          isHidden: !widget.isHidden,
                        })
                      }
                      type="button"
                    >
                      {widget.isHidden ? t`Show` : t`Hide`}
                    </StyledButton>
                    <StyledButton
                      aria-label={t`Move widget up`}
                      disabled={widgetIndex === 0}
                      onClick={() => moveCustomDashboardWidget(widget.id, -1)}
                      type="button"
                    >
                      <IconArrowUp size={theme.icon.size.sm} />
                    </StyledButton>
                    <StyledButton
                      aria-label={t`Move widget down`}
                      disabled={
                        widgetIndex === customDashboardWidgets.length - 1
                      }
                      onClick={() => moveCustomDashboardWidget(widget.id, 1)}
                      type="button"
                    >
                      <IconArrowDown size={theme.icon.size.sm} />
                    </StyledButton>
                    <StyledButton
                      aria-label={t`Remove widget`}
                      onClick={() => removeCustomDashboardWidget(widget.id)}
                      type="button"
                    >
                      <IconTrash size={theme.icon.size.sm} />
                    </StyledButton>
                  </StyledCustomWidgetEditor>
                );
              })}
            </StyledCustomWidgetList>
            <StyledSignalSettings>
              <StyledPreferenceLabel>
                {t`Pipeline signals (opportunities)`}
              </StyledPreferenceLabel>
              <StyledSmallMutedText>
                {t`Map the fields this workspace uses for the next step and the last activity. Without a mapping, activity is read from the activity timeline of the loaded opportunities (which carries notes and emails) together with their linked tasks and calendar events.`}
              </StyledSmallMutedText>
              <StyledSignalSettingsRow>
                <StyledSignalField>
                  <StyledPreferenceLabel>{t`Last activity`}</StyledPreferenceLabel>
                  <StyledPreferenceSelect
                    onChange={(event) =>
                      updateSignalFieldSettings({
                        lastActivityFieldMetadataId: event.target.value || null,
                      })
                    }
                    value={
                      homePagePreferences.signalFieldSettings
                        ?.lastActivityFieldMetadataId ?? ''
                    }
                  >
                    <option value="">{t`Not configured`}</option>
                    {lastActivityFieldCandidates.map((fieldMetadataItem) => (
                      <option
                        key={fieldMetadataItem.id}
                        value={fieldMetadataItem.id}
                      >
                        {fieldMetadataItem.label}
                      </option>
                    ))}
                  </StyledPreferenceSelect>
                </StyledSignalField>
                <StyledSignalField>
                  <StyledPreferenceLabel>{t`Next step`}</StyledPreferenceLabel>
                  <StyledPreferenceSelect
                    onChange={(event) =>
                      updateSignalFieldSettings({
                        nextStepFieldMetadataId: event.target.value || null,
                      })
                    }
                    value={
                      homePagePreferences.signalFieldSettings
                        ?.nextStepFieldMetadataId ?? ''
                    }
                  >
                    <option value="">{t`Not configured`}</option>
                    {nextStepFieldCandidates.map((fieldMetadataItem) => (
                      <option
                        key={fieldMetadataItem.id}
                        value={fieldMetadataItem.id}
                      >
                        {fieldMetadataItem.label}
                      </option>
                    ))}
                  </StyledPreferenceSelect>
                </StyledSignalField>
                <StyledSignalField>
                  <StyledPreferenceLabel>{t`Next step date`}</StyledPreferenceLabel>
                  <StyledPreferenceSelect
                    onChange={(event) =>
                      updateSignalFieldSettings({
                        nextStepDateFieldMetadataId: event.target.value || null,
                      })
                    }
                    value={
                      homePagePreferences.signalFieldSettings
                        ?.nextStepDateFieldMetadataId ?? ''
                    }
                  >
                    <option value="">{t`Not configured`}</option>
                    {nextStepDateFieldCandidates.map((fieldMetadataItem) => (
                      <option
                        key={fieldMetadataItem.id}
                        value={fieldMetadataItem.id}
                      >
                        {fieldMetadataItem.label}
                      </option>
                    ))}
                  </StyledPreferenceSelect>
                </StyledSignalField>
                <StyledSignalField>
                  <StyledPreferenceLabel>{t`Stalled after days`}</StyledPreferenceLabel>
                  <StyledPreferenceInput
                    min={1}
                    onChange={(event) =>
                      updateHomePagePreferences((current) => ({
                        ...current,
                        staleOpportunityDayLimit: Math.max(
                          1,
                          Number(event.target.value) || 1,
                        ),
                      }))
                    }
                    type="number"
                    value={staleOpportunityDayLimit}
                  />
                </StyledSignalField>
              </StyledSignalSettingsRow>
              <StyledSmallMutedText>
                {`${lastActivitySourceLabel} · ${nextStepSourceLabel}`}
              </StyledSmallMutedText>
              <StyledSmallMutedText>
                {opportunityActivityDiagnostics.isTimelineQuerySkipped
                  ? t`Activity timeline: no opportunity is loaded, so no activity is read`
                  : t`Activity timeline: ${opportunityActivityDiagnostics.opportunitiesWithRecordedActivityCount} of ${opportunityActivityDiagnostics.opportunitiesTrackedCount} loaded opportunities have recorded activity within ${opportunityActivityDiagnostics.activityWindowDays} days`}
              </StyledSmallMutedText>
              {timelineSourceSummaryLabel.length > 0 && (
                <StyledSmallMutedText>
                  {t`Timeline in window: ${timelineSourceSummaryLabel}`}
                </StyledSmallMutedText>
              )}
              <StyledSmallMutedText>
                {t`Timeline filter: ${opportunityActivityDiagnostics.targetFieldName} · window from ${beautifyExactDate(opportunityActivityDiagnostics.windowStartsAt)}`}
              </StyledSmallMutedText>
              {opportunityActivityDiagnostics.unlinkedTimelineActivityCount >
                0 && (
                <StyledSmallMutedText>
                  {t`${opportunityActivityDiagnostics.unlinkedTimelineActivityCount} timeline entries carry no opportunity link and are ignored`}
                </StyledSmallMutedText>
              )}
              {opportunityActivityDiagnostics.isTimelineTruncated && (
                <StyledSmallMutedText>
                  {t`Timeline truncated at ${opportunityActivityDiagnostics.timelineActivityLimit} entries, older activity is not considered`}
                </StyledSmallMutedText>
              )}
            </StyledSignalSettings>
            <StyledPreferenceLabel>
              {t`Targets and layout are saved for you in this browser.`}
            </StyledPreferenceLabel>
          </StyledPreferences>
        )}

        {(!isAiHidden || isCustomizing) && (
          <StyledWidgetFrame isHidden={isAiHidden}>
            {isCustomizing && (
              <StyledWidgetControls>
                <span>{widgetLabels.ai}</span>
                <StyledActions>
                  <StyledButton
                    active={!isAiHidden}
                    disabled={isAiUnavailable}
                    onClick={() => toggleWidget('ai')}
                    type="button"
                  >
                    {isAiHidden ? t`Show` : t`Hide`}
                  </StyledButton>
                </StyledActions>
              </StyledWidgetControls>
            )}
            {!isAiHidden && (
              <>
                <StyledAiHeader>
                  <StyledSectionTitle>{t`AI assistant`}</StyledSectionTitle>
                  <StyledButton
                    onClick={() =>
                      updateHomePagePreferences((current) => ({
                        ...current,
                        isAiCollapsed: !current.isAiCollapsed,
                      }))
                    }
                    type="button"
                  >
                    {homePagePreferences.isAiCollapsed
                      ? t`Expand`
                      : t`Collapse`}
                  </StyledButton>
                </StyledAiHeader>
                {!homePagePreferences.isAiCollapsed && widgetContent.ai}
              </>
            )}
          </StyledWidgetFrame>
        )}

        <StyledPanel>
          <StyledPanelHeader>
            <StyledPanelTitle>{t`Important today`}</StyledPanelTitle>
            <StyledSmallMutedText>
              {filteredPriorityItems.length === 0
                ? t`Nothing needs attention`
                : priorityItems.length < filteredPriorityItems.length
                  ? t`${priorityItems.length} of ${filteredPriorityItems.length} priorities`
                  : t`${filteredPriorityItems.length} priorities`}
            </StyledSmallMutedText>
          </StyledPanelHeader>
          <StyledFilterRow aria-label={t`Priority filters`}>
            {priorityFilters.map((filter) => (
              <StyledButton
                active={priorityFilter === filter.id}
                key={filter.id}
                onClick={() => setPriorityFilter(filter.id)}
                type="button"
              >
                {filter.label}
                {priorityCountByCategory[filter.id] > 0 && (
                  <StyledSmallMutedText>
                    {priorityCountByCategory[filter.id]}
                  </StyledSmallMutedText>
                )}
              </StyledButton>
            ))}
          </StyledFilterRow>
          {isDashboardRefreshing ? (
            <StyledEmptyState>{t`Loading priorities…`}</StyledEmptyState>
          ) : filteredPriorityItems.length === 0 ? (
            <StyledEmptyState>
              <IconCheckbox size={theme.icon.size.lg} />
              <span>
                {priorityFilter === 'all'
                  ? t`Everything important is on track.`
                  : t`Nothing in this filter right now.`}
              </span>
              {priorityFilter !== 'all' && (
                <StyledButton
                  onClick={() => setPriorityFilter('all')}
                  type="button"
                >
                  {t`Show all priorities`}
                </StyledButton>
              )}
            </StyledEmptyState>
          ) : (
            <>
              <StyledPriorityList>
                {priorityItems.map((priorityItem) => (
                  <StyledPriorityRow key={priorityItem.id} to={priorityItem.to}>
                    <StyledPriorityIcon severity={priorityItem.severity}>
                      {priorityItem.icon}
                    </StyledPriorityIcon>
                    <StyledPriorityText>
                      <StyledTruncatedText>
                        {priorityItem.title}
                      </StyledTruncatedText>
                      <StyledPriorityReason severity={priorityItem.severity}>
                        {priorityItem.meta}
                      </StyledPriorityReason>
                    </StyledPriorityText>
                    <IconArrowRight size={theme.icon.size.sm} />
                  </StyledPriorityRow>
                ))}
              </StyledPriorityList>
              {filteredPriorityItems.length > PRIORITY_ITEM_LIMIT && (
                <StyledFilterRow>
                  <StyledButton
                    onClick={() =>
                      setIsPriorityListExpanded((current) => !current)
                    }
                    type="button"
                  >
                    {isPriorityListExpanded
                      ? t`Show fewer`
                      : t`Show all ${filteredPriorityItems.length}`}
                  </StyledButton>
                </StyledFilterRow>
              )}
            </>
          )}
        </StyledPanel>

        <StyledDashboardHeader>
          <StyledDashboardTitleGroup>
            <StyledDashboardEyebrow>
              {dashboardPeriod === 'week'
                ? t`Weekly cockpit`
                : t`Monthly cockpit`}
            </StyledDashboardEyebrow>
            <StyledSectionTitle>
              {dashboardView === 'personal'
                ? t`My performance at a glance`
                : t`What the team is working on`}
            </StyledSectionTitle>
          </StyledDashboardTitleGroup>
          <StyledDashboardControls>
            <StyledDashboardTabs aria-label={t`Dashboard period`}>
              <StyledDashboardTab
                active={dashboardPeriod === 'week'}
                onClick={() =>
                  updateHomePagePreferences((current) => ({
                    ...current,
                    dashboardPeriod: 'week',
                  }))
                }
                type="button"
              >
                {t`Week`}
              </StyledDashboardTab>
              <StyledDashboardTab
                active={dashboardPeriod === 'month'}
                onClick={() =>
                  updateHomePagePreferences((current) => ({
                    ...current,
                    dashboardPeriod: 'month',
                  }))
                }
                type="button"
              >
                {t`Month`}
              </StyledDashboardTab>
            </StyledDashboardTabs>
            <StyledDashboardTabs role="tablist" aria-label={t`Dashboard view`}>
              <StyledDashboardTab
                active={dashboardView === 'personal'}
                aria-selected={dashboardView === 'personal'}
                onClick={() =>
                  updateHomePagePreferences((current) => ({
                    ...current,
                    dashboardView: 'personal',
                  }))
                }
                role="tab"
                type="button"
              >
                {t`For me`}
              </StyledDashboardTab>
              {hasTeamDashboardPermission && (
                <StyledDashboardTab
                  active={dashboardView === 'team'}
                  aria-selected={dashboardView === 'team'}
                  onClick={() =>
                    updateHomePagePreferences((current) => ({
                      ...current,
                      dashboardView: 'team',
                    }))
                  }
                  role="tab"
                  type="button"
                >
                  {t`Team`}
                </StyledDashboardTab>
              )}
            </StyledDashboardTabs>
          </StyledDashboardControls>
        </StyledDashboardHeader>

        <StyledDataStatus aria-live="polite">
          <StyledDataStatusItem>
            <IconDatabase size={theme.icon.size.sm} />
            {isDashboardRefreshing
              ? t`Refreshing Twenty data…`
              : t`Live from Twenty`}
          </StyledDataStatusItem>
          <StyledDataStatusItem>
            <IconTarget size={theme.icon.size.sm} />
            {dashboardPeriod === 'week' ? t`This week` : t`This month`}
          </StyledDataStatusItem>
        </StyledDataStatus>

        {customDashboardWidgets.length > 0 && (
          <StyledCustomWidgetGrid>
            {customDashboardWidgets
              .filter((widget) => !widget.isHidden)
              .map((widget) => (
                <HomeDashboardCustomWidgetCard
                  key={widget.id}
                  objectMetadataItem={readableObjects.find(
                    (item) => item.id === widget.objectMetadataId,
                  )}
                  periodEndsAt={periodEndsAt}
                  periodStartsAt={periodStartsAt}
                  widget={widget}
                />
              ))}
          </StyledCustomWidgetGrid>
        )}

        {dashboardView === 'personal' ? (
          <>
            <StyledKpiGrid>
              <StyledKpiCard>
                <StyledKpiLabel>
                  <IconCheckbox size={theme.icon.size.sm} />
                  {t`Open tasks`}
                </StyledKpiLabel>
                <StyledKpiValue>
                  {personalOpenTaskCount}
                  {isPersonalTaskCountTruncated ? '+' : ''}
                </StyledKpiValue>
                <TargetProgressBar
                  ariaLabel={t`Open tasks against limit`}
                  tone={
                    personalOpenTaskCount > openTaskTarget
                      ? 'attention'
                      : 'default'
                  }
                  value={(personalOpenTaskCount / openTaskTarget) * 100}
                  valueText={t`${personalOpenTaskCount} open tasks, limit ${openTaskTarget}`}
                />
                <StyledKpiFooter>
                  <StyledKpiContext warning={personalOverdueTaskCount > 0}>
                    {isPersonalOverdueTaskCountTruncated
                      ? t`${personalOverdueTaskCount}+ overdue`
                      : t`${personalOverdueTaskCount} overdue`}
                  </StyledKpiContext>
                  <StyledSmallMutedText>
                    {personalOpenTaskCount > openTaskTarget
                      ? t`Limit ${openTaskTarget} · ${personalOpenTaskCount - openTaskTarget} over`
                      : t`Limit ${openTaskTarget}`}
                  </StyledSmallMutedText>
                </StyledKpiFooter>
              </StyledKpiCard>
              <StyledKpiCard>
                <StyledKpiLabel>
                  <IconCalendarEvent size={theme.icon.size.sm} />
                  {dashboardPeriod === 'week'
                    ? t`Meetings this week`
                    : t`Meetings this month`}
                </StyledKpiLabel>
                <StyledKpiValue>
                  {currentPeriodMeetings.length}
                  {isCalendarEventListTruncated ? '+' : ''}
                </StyledKpiValue>
                <TargetProgressBar
                  ariaLabel={t`Meetings against target`}
                  tone={
                    currentPeriodMeetings.length >= periodMeetingTarget
                      ? 'success'
                      : 'default'
                  }
                  value={
                    (currentPeriodMeetings.length / periodMeetingTarget) * 100
                  }
                  valueText={t`${currentPeriodMeetings.length} meetings, target ${periodMeetingTarget}`}
                />
                <StyledKpiFooter>
                  {isCalendarEventListTruncated ? (
                    <StyledSmallMutedText>
                      {t`Comparison unavailable · calendar list is capped`}
                    </StyledSmallMutedText>
                  ) : (
                    <StyledDelta positive={meetingDelta >= 0}>
                      {meetingDelta >= 0 ? (
                        <IconTrendingUp size={theme.icon.size.sm} />
                      ) : (
                        <IconTrendingDown size={theme.icon.size.sm} />
                      )}
                      {t`${Math.abs(meetingDelta)} vs previous period`}
                    </StyledDelta>
                  )}
                  <StyledSmallMutedText>
                    {t`Target ${periodMeetingTarget}`}
                  </StyledSmallMutedText>
                </StyledKpiFooter>
              </StyledKpiCard>
              <StyledKpiCard>
                <StyledKpiLabel>
                  <IconUsers size={theme.icon.size.sm} />
                  {t`Management / advisor meetings`}
                </StyledKpiLabel>
                <StyledKpiValue>
                  {currentPeriodManagementMeetings.length} /{' '}
                  {currentPeriodAdvisorMeetings.length}
                </StyledKpiValue>
                <StyledKpiFooter>
                  <StyledKpiContext>
                    {t`Inferred from meeting title`}
                  </StyledKpiContext>
                  <StyledSmallMutedText>
                    {dashboardPeriod === 'week' ? t`This week` : t`This month`}
                  </StyledSmallMutedText>
                </StyledKpiFooter>
              </StyledKpiCard>
              <StyledKpiCard>
                <StyledKpiLabel>
                  <IconChartBar size={theme.icon.size.sm} />
                  {t`Campaign delivery`}
                </StyledKpiLabel>
                <StyledKpiValue>
                  {hasCampaignDeliveryData ? `${overallDeliveryRate}%` : '—'}
                </StyledKpiValue>
                <TargetProgressBar
                  ariaLabel={t`Delivery rate against target`}
                  tone={
                    hasCampaignDeliveryData &&
                    overallDeliveryRate < deliveryRateTarget
                      ? 'attention'
                      : 'default'
                  }
                  value={
                    hasCampaignDeliveryData
                      ? (overallDeliveryRate / deliveryRateTarget) * 100
                      : 0
                  }
                  valueText={
                    hasCampaignDeliveryData
                      ? t`${overallDeliveryRate}% delivered, target ${deliveryRateTarget}%`
                      : t`Delivery rate unavailable`
                  }
                />
                <StyledKpiFooter>
                  {!hasCampaignDeliveryData ? (
                    <StyledSmallMutedText>{t`No sent campaigns yet`}</StyledSmallMutedText>
                  ) : previousCampaigns.length > 0 ? (
                    <StyledDelta
                      positive={campaignDeliveryDelta >= 0}
                      warning={campaignDeliveryDelta < 0}
                    >
                      {campaignDeliveryDelta >= 0 ? (
                        <IconTrendingUp size={theme.icon.size.sm} />
                      ) : (
                        <IconTrendingDown size={theme.icon.size.sm} />
                      )}
                      {t`${Math.abs(campaignDeliveryDelta)} pts vs previous campaigns`}
                    </StyledDelta>
                  ) : (
                    <StyledSmallMutedText>{t`No comparison yet`}</StyledSmallMutedText>
                  )}
                  <StyledSmallMutedText>
                    {t`Target ${deliveryRateTarget}%`}
                  </StyledSmallMutedText>
                </StyledKpiFooter>
              </StyledKpiCard>
            </StyledKpiGrid>

            <StyledOperationalStack>
              <StyledPipelinePanel>
                <StyledPanelHeader>
                  <StyledPanelTitle>{t`My pipeline`}</StyledPanelTitle>
                  <StyledSmallMutedText>
                    {isNextStepFieldConfigured
                      ? nextStepSourceLabel
                      : t`Stalled after ${staleOpportunityDayLimit} days`}
                  </StyledSmallMutedText>
                </StyledPanelHeader>
                {areOpportunitiesLoading ? (
                  <StyledEmptyState>{t`Loading pipeline…`}</StyledEmptyState>
                ) : personalOpportunities.length === 0 ? (
                  <StyledEmptyState>
                    <IconCurrencyDollar size={theme.icon.size.lg} />
                    <span>{t`No open opportunities assigned to you.`}</span>
                    {isDefined(opportunitiesIndexPath) && (
                      <StyledSectionLink to={opportunitiesIndexPath}>
                        {t`Open opportunities`}{' '}
                        <IconArrowRight size={theme.icon.size.sm} />
                      </StyledSectionLink>
                    )}
                  </StyledEmptyState>
                ) : (
                  <>
                    <StyledPipelineSummary>
                      <StyledPipelineTotals>
                        <StyledKpiLabel>{t`Open pipeline value`}</StyledKpiLabel>
                        <StyledPipelineValue>
                          {getPipelineValueLabel(personalOpportunities)}
                        </StyledPipelineValue>
                        <StyledSmallMutedText>
                          {isPersonalOpportunityListTruncated
                            ? t`${personalOpportunities.length}+ opportunities · ${personalOpportunitiesClosingThisPeriod.length} closing this period`
                            : t`${personalOpportunities.length} opportunities · ${personalOpportunitiesClosingThisPeriod.length} closing this period`}
                        </StyledSmallMutedText>
                        <StyledKpiContext
                          warning={personalOpportunityRisks.length > 0}
                        >
                          {t`${stalePersonalOpportunities.length} stalled · ${personalOpportunitiesWithoutNextStep.length} without next step · ${overduePersonalOpportunities.length} past close date`}
                        </StyledKpiContext>
                        <StyledSmallMutedText>
                          {`${lastActivitySourceLabel} · ${nextStepSourceLabel} · ${t`stalled after ${staleOpportunityDayLimit} days`} · ${t`activity window ${activityWindowDays} days`}`}
                        </StyledSmallMutedText>
                        {isPersonalOpportunityListTruncated && (
                          <StyledSmallMutedText>
                            {t`Value calculated from the latest ${OPPORTUNITY_LIMIT} loaded opportunities`}
                          </StyledSmallMutedText>
                        )}
                      </StyledPipelineTotals>
                      <StyledStageList aria-label={t`Pipeline by stage`}>
                        {personalOpportunityStageCounts.map(
                          ({ count, stage }) => (
                            <StyledStageRow
                              key={stage}
                              to={getAppPath(AppPath.RecordIndexPage, {
                                objectNamePlural:
                                  CoreObjectNamePlural.Opportunity,
                              })}
                            >
                              <StyledSmallMutedText>
                                {getOpportunityStageLabel(stage)}
                              </StyledSmallMutedText>
                              <StyledProgressTrack
                                aria-label={t`${getOpportunityStageLabel(stage)}: ${count} of ${personalOpportunities.length}`}
                                aria-valuemax={personalOpportunities.length}
                                aria-valuemin={0}
                                aria-valuenow={count}
                                role="progressbar"
                              >
                                <StyledProgressValue
                                  value={
                                    (count / largestPersonalStageCount) * 100
                                  }
                                />
                              </StyledProgressTrack>
                              <StyledStageCount>{count}</StyledStageCount>
                            </StyledStageRow>
                          ),
                        )}
                      </StyledStageList>
                    </StyledPipelineSummary>
                    <StyledPanelHeader>
                      <StyledPanelTitle>{t`Pipeline focus`}</StyledPanelTitle>
                      <StyledSmallMutedText>
                        {t`Signals and nearest close date first`}
                      </StyledSmallMutedText>
                    </StyledPanelHeader>
                    {personalPipelineAttentionItems.map((opportunity) => (
                      <StyledOpportunityRow
                        key={opportunity.id}
                        title={getOpportunitySignalTooltip(opportunity)}
                        to={getAppPath(AppPath.RecordShowPage, {
                          objectNameSingular:
                            CoreObjectNameSingular.Opportunity,
                          objectRecordId: opportunity.id,
                        })}
                      >
                        <StyledRecordTitle>
                          {opportunity.name || t`Untitled opportunity`}
                        </StyledRecordTitle>
                        <StyledSmallMutedText>
                          {getOpportunityStageLabel(opportunity.stage)}
                        </StyledSmallMutedText>
                        <StyledWorkloadBadge
                          warning={
                            getOpportunitySignalReasons(opportunity.id).length >
                            0
                          }
                        >
                          {getOpportunityPrimaryReasonLabel(opportunity) ??
                            (isDefined(opportunity.closeDate)
                              ? beautifyExactDate(opportunity.closeDate)
                              : t`No close date`)}
                        </StyledWorkloadBadge>
                      </StyledOpportunityRow>
                    ))}
                  </>
                )}
              </StyledPipelinePanel>

              <StyledCampaignPanel>
                <StyledPanelHeader>
                  <StyledPanelTitle>{t`Campaign delivery`}</StyledPanelTitle>
                  <StyledActions>
                    <StyledSmallMutedText>
                      {t`Delivery metrics only`}
                    </StyledSmallMutedText>
                    {isDefined(campaignsIndexPath) && (
                      <StyledSectionLink to={campaignsIndexPath}>
                        {t`View all`}{' '}
                        <IconArrowRight size={theme.icon.size.sm} />
                      </StyledSectionLink>
                    )}
                  </StyledActions>
                </StyledPanelHeader>
                {areMessageCampaignsLoading ? (
                  <StyledEmptyState>{t`Loading campaigns…`}</StyledEmptyState>
                ) : messageCampaigns.length === 0 ? (
                  <StyledEmptyState>
                    <IconMail size={theme.icon.size.lg} />
                    <span>{t`No campaigns are visible yet.`}</span>
                    {isDefined(campaignsIndexPath) && (
                      <StyledSectionLink to={campaignsIndexPath}>
                        {t`Open campaigns`}{' '}
                        <IconArrowRight size={theme.icon.size.sm} />
                      </StyledSectionLink>
                    )}
                  </StyledEmptyState>
                ) : (
                  messageCampaigns.slice(0, 4).map((campaign) => {
                    const deliveryRate =
                      campaign.sentCount > 0
                        ? Math.min(
                            100,
                            Math.round(
                              (campaign.deliveredCount / campaign.sentCount) *
                                100,
                            ),
                          )
                        : 0;

                    return (
                      <StyledCampaignRow
                        key={campaign.id}
                        to={getAppPath(AppPath.RecordShowPage, {
                          objectNameSingular:
                            CoreObjectNameSingular.MessageCampaign,
                          objectRecordId: campaign.id,
                        })}
                      >
                        <StyledCampaignHeading>
                          <IconMail size={theme.icon.size.sm} />
                          <StyledRecordTitle>{campaign.name}</StyledRecordTitle>
                          <StyledStatusBadge>
                            {campaign.status}
                          </StyledStatusBadge>
                        </StyledCampaignHeading>
                        <StyledProgressTrack
                          aria-label={t`${campaign.name} delivered`}
                          aria-valuemax={100}
                          aria-valuemin={0}
                          aria-valuenow={deliveryRate}
                          role="progressbar"
                        >
                          <StyledProgressValue value={deliveryRate} />
                        </StyledProgressTrack>
                        <StyledCampaignMetrics>
                          <span>
                            {campaign.sentCount > 0
                              ? t`${deliveryRate}% delivered`
                              : t`Delivery not available`}
                          </span>
                          <span>{t`${campaign.sentCount} sent`}</span>
                          <span>{t`${campaign.failedCount} failed`}</span>
                          <span>{t`${campaign.skippedCount} skipped`}</span>
                          <span>{t`${campaign.bouncedCount} bounced`}</span>
                          <span>{t`${campaign.complainedCount} complaints`}</span>
                        </StyledCampaignMetrics>
                      </StyledCampaignRow>
                    );
                  })
                )}
              </StyledCampaignPanel>
            </StyledOperationalStack>
          </>
        ) : (
          <>
            <StyledKpiGrid>
              <StyledKpiCard>
                <StyledKpiLabel>
                  <IconUsers size={theme.icon.size.sm} />
                  {t`Team members`}
                </StyledKpiLabel>
                <StyledKpiValue>{workspaceMembers.length}</StyledKpiValue>
                <StyledKpiContext>{t`Included in team overview`}</StyledKpiContext>
              </StyledKpiCard>
              <StyledKpiCard>
                <StyledKpiLabel>
                  <IconAlertTriangle size={theme.icon.size.sm} />
                  {t`Needs attention`}
                </StyledKpiLabel>
                <StyledKpiValue>{teamMembersNeedingAttention}</StyledKpiValue>
                <StyledKpiContext warning={teamMembersNeedingAttention > 0}>
                  {t`${teamAttentionTotals.overdueTasks} overdue tasks · ${teamAttentionTotals.staleOpportunities} stalled deals · ${teamAttentionTotals.withoutNextStep} without next step · ${teamAttentionTotals.overCapacity} over capacity`}
                </StyledKpiContext>
              </StyledKpiCard>
              <StyledKpiCard>
                <StyledKpiLabel>
                  <IconCurrencyDollar size={theme.icon.size.sm} />
                  {t`Open team pipeline`}
                </StyledKpiLabel>
                <StyledKpiValue>
                  {getPipelineValueLabel(opportunities)}
                </StyledKpiValue>
                <StyledKpiContext>
                  {isTeamOpenOpportunityCountTruncated
                    ? t`${teamOpenOpportunityCount}+ open opportunities`
                    : t`${teamOpenOpportunityCount} open opportunities`}
                </StyledKpiContext>
                {isOpportunityListTruncated && (
                  <StyledSmallMutedText>
                    {t`Value calculated from the latest ${OPPORTUNITY_LIMIT} loaded opportunities`}
                  </StyledSmallMutedText>
                )}
                {isTeamOpenTaskCountTruncated && (
                  <StyledSmallMutedText>
                    {t`Task lists are capped at ${TEAM_TASK_LIMIT} open tasks`}
                  </StyledSmallMutedText>
                )}
              </StyledKpiCard>
              <StyledKpiCard>
                <StyledKpiLabel>
                  <IconChartBar size={theme.icon.size.sm} />
                  {t`Delivery rate`}
                </StyledKpiLabel>
                <StyledKpiValue>
                  {hasCampaignDeliveryData ? `${overallDeliveryRate}%` : '—'}
                </StyledKpiValue>
                <StyledKpiContext>
                  {hasCampaignDeliveryData
                    ? t`${activeCampaigns.length} campaigns currently running`
                    : t`Technical delivery not available`}
                </StyledKpiContext>
              </StyledKpiCard>
            </StyledKpiGrid>

            <StyledPanel>
              <StyledPanelHeader>
                <StyledPanelTitle>{t`Who is working on what`}</StyledPanelTitle>
                <StyledSmallMutedText>
                  {isTeamOpenTaskCountTruncated
                    ? t`${teamOpenTaskCount}+ open tasks · ${visibleTeamMemberCount} of ${teamMemberPerformance.length} members`
                    : t`${teamOpenTaskCount} open tasks · ${visibleTeamMemberCount} of ${teamMemberPerformance.length} members`}
                </StyledSmallMutedText>
              </StyledPanelHeader>
              {areTeamTasksLoading ||
              areWorkspaceMembersLoading ||
              areOpportunitiesLoading ? (
                <StyledEmptyState>{t`Loading team work…`}</StyledEmptyState>
              ) : teamMemberPerformance.length === 0 ? (
                <StyledEmptyState>{t`No visible team work yet.`}</StyledEmptyState>
              ) : (
                <StyledWorkstreamGrid>
                  {teamMemberPerformance
                    .slice(0, TEAM_MEMBER_VISIBLE_LIMIT)
                    .map(
                      ({
                        attentionSignalCount,
                        isOverCapacity,
                        meetingCount,
                        member,
                        missingNextStepCount,
                        opportunities: memberOpportunities,
                        overdueOpportunityCount,
                        overdueTaskCount,
                        staleOpportunityCount,
                        tasks: memberTasks,
                      }) => {
                        const displayName =
                          `${member.name.firstName} ${member.name.lastName}`.trim();
                        const initials =
                          `${member.name.firstName.at(0) ?? ''}${member.name.lastName.at(0) ?? ''}`.toUpperCase();
                        const attentionReasons = getAttentionReasonLabels({
                          isOverCapacity,
                          missingNextStepCount,
                          overdueOpportunityCount,
                          overdueTaskCount,
                          staleOpportunityCount,
                        });

                        return (
                          <StyledWorkstreamCard key={member.id}>
                            <StyledMemberCell>
                              <StyledMemberAvatar>
                                {initials}
                              </StyledMemberAvatar>
                              <StyledMemberName>
                                <StyledTruncatedText>
                                  {displayName}
                                </StyledTruncatedText>
                                <StyledSmallMutedText>
                                  {member.jobTitle || t`No role specified`}
                                </StyledSmallMutedText>
                              </StyledMemberName>
                            </StyledMemberCell>
                            <StyledWorkstreamMetrics>
                              <StyledMetricCell>
                                <strong>{memberTasks.length}</strong>
                                <StyledSmallMutedText>{t`Open tasks`}</StyledSmallMutedText>
                              </StyledMetricCell>
                              <StyledMetricCell>
                                <strong>
                                  {getPipelineValueLabel(memberOpportunities)}
                                </strong>
                                <StyledSmallMutedText>
                                  {t`${memberOpportunities.length} open opportunities`}
                                </StyledSmallMutedText>
                              </StyledMetricCell>
                              <StyledMetricCell>
                                <strong>{meetingCount}</strong>
                                <StyledSmallMutedText>{t`Meetings in period`}</StyledSmallMutedText>
                              </StyledMetricCell>
                              <StyledMetricCell>
                                <strong>{attentionSignalCount}</strong>
                                <StyledKpiContext
                                  warning={attentionSignalCount > 0}
                                >
                                  {t`Attention signals`}
                                </StyledKpiContext>
                              </StyledMetricCell>
                            </StyledWorkstreamMetrics>
                            <StyledSmallMutedText>
                              {attentionReasons.length > 0
                                ? attentionReasons.join(' · ')
                                : t`No open attention signals`}
                            </StyledSmallMutedText>
                          </StyledWorkstreamCard>
                        );
                      },
                    )}
                </StyledWorkstreamGrid>
              )}
            </StyledPanel>

            <StyledPanel>
              <StyledPanelHeader>
                <StyledPanelTitle>{t`Campaign control center`}</StyledPanelTitle>
                <StyledActions>
                  <StyledSmallMutedText>
                    {isMessageCampaignListTruncated
                      ? t`Showing ${visibleCampaignCount} of ${messageCampaigns.length}+ campaigns · delivery metrics only`
                      : t`Showing ${visibleCampaignCount} of ${messageCampaigns.length} campaigns · delivery metrics only`}
                  </StyledSmallMutedText>
                  {isDefined(campaignsIndexPath) && (
                    <StyledSectionLink to={campaignsIndexPath}>
                      {t`View all`} <IconArrowRight size={theme.icon.size.sm} />
                    </StyledSectionLink>
                  )}
                </StyledActions>
              </StyledPanelHeader>
              {areMessageCampaignsLoading ? (
                <StyledEmptyState>{t`Loading campaigns…`}</StyledEmptyState>
              ) : messageCampaigns.length === 0 ? (
                <StyledEmptyState>
                  <IconMail size={theme.icon.size.lg} />
                  <span>{t`No visible campaigns yet.`}</span>
                  {isDefined(campaignsIndexPath) && (
                    <StyledSectionLink to={campaignsIndexPath}>
                      {t`Open campaigns`}{' '}
                      <IconArrowRight size={theme.icon.size.sm} />
                    </StyledSectionLink>
                  )}
                </StyledEmptyState>
              ) : (
                messageCampaigns
                  .slice(0, CAMPAIGN_PREVIEW_LIMIT)
                  .map((campaign) => {
                    const campaignDeliveryRate =
                      campaign.sentCount > 0
                        ? Math.min(
                            100,
                            Math.round(
                              (campaign.deliveredCount / campaign.sentCount) *
                                100,
                            ),
                          )
                        : null;

                    return (
                      <StyledCampaignRow
                        key={campaign.id}
                        to={getAppPath(AppPath.RecordShowPage, {
                          objectNameSingular:
                            CoreObjectNameSingular.MessageCampaign,
                          objectRecordId: campaign.id,
                        })}
                      >
                        <StyledCampaignHeading>
                          <IconMail size={theme.icon.size.sm} />
                          <StyledRecordTitle>{campaign.name}</StyledRecordTitle>
                          <StyledStatusBadge>
                            {campaign.status}
                          </StyledStatusBadge>
                        </StyledCampaignHeading>
                        <StyledProgressTrack
                          aria-label={t`${campaign.name} delivered`}
                          aria-valuemax={100}
                          aria-valuemin={0}
                          aria-valuenow={campaignDeliveryRate ?? 0}
                          role="progressbar"
                        >
                          <StyledProgressValue
                            value={campaignDeliveryRate ?? 0}
                          />
                        </StyledProgressTrack>
                        <StyledCampaignMetrics>
                          <span>
                            {isDefined(campaignDeliveryRate)
                              ? t`${campaignDeliveryRate}% delivered`
                              : t`Delivery: Not available`}
                          </span>
                          <span>{t`${campaign.sentCount} sent`}</span>
                          <span>{t`${campaign.failedCount + campaign.bouncedCount} failed or bounced`}</span>
                        </StyledCampaignMetrics>
                      </StyledCampaignRow>
                    );
                  })
              )}
            </StyledPanel>
          </>
        )}

        <StyledSection>
          <StyledSectionTitle>{t`My day`}</StyledSectionTitle>
          <StyledMyDayGrid>
            {movableWidgetOrder.map((widgetId, widgetIndex) => {
              const unavailable =
                widgetId === 'recent-views' && recentViews.length === 0;
              const isHidden =
                homePagePreferences.hiddenWidgetIds.includes(widgetId) ||
                unavailable;
              if (isHidden && !isCustomizing) {
                return null;
              }
              return (
                <StyledWidgetFrame
                  key={widgetId}
                  draggable={isCustomizing}
                  isCustomizing={isCustomizing}
                  isHidden={isHidden}
                  onDragEnd={() => setDraggedWidgetId(null)}
                  onDragOver={(event) => {
                    if (isCustomizing) {
                      event.preventDefault();
                    }
                  }}
                  onDragStart={() => setDraggedWidgetId(widgetId)}
                  onDrop={() => {
                    if (isDefined(draggedWidgetId)) {
                      moveWidgetBefore(draggedWidgetId, widgetId);
                    }
                    setDraggedWidgetId(null);
                  }}
                >
                  {isCustomizing && (
                    <StyledWidgetControls>
                      <span>{widgetLabels[widgetId]}</span>
                      <StyledActions>
                        <StyledButton
                          aria-label={t`Move widget up`}
                          disabled={widgetIndex === 0}
                          onClick={() => moveWidget(widgetId, -1)}
                          type="button"
                        >
                          <IconArrowUp size={theme.icon.size.sm} />
                        </StyledButton>
                        <StyledButton
                          aria-label={t`Move widget down`}
                          disabled={
                            widgetIndex === movableWidgetOrder.length - 1
                          }
                          onClick={() => moveWidget(widgetId, 1)}
                          type="button"
                        >
                          <IconArrowDown size={theme.icon.size.sm} />
                        </StyledButton>
                        <StyledButton
                          active={!isHidden}
                          disabled={unavailable}
                          onClick={() => toggleWidget(widgetId)}
                          type="button"
                        >
                          {isHidden ? t`Show` : t`Hide`}
                        </StyledButton>
                      </StyledActions>
                    </StyledWidgetControls>
                  )}
                  {!isHidden && widgetContent[widgetId]}
                </StyledWidgetFrame>
              );
            })}
          </StyledMyDayGrid>
        </StyledSection>
      </StyledContent>
    </PageCardLayout>
  );
};

export const HomePage = () => {
  const isMobile = useIsMobile();
  const metadataStore = useAtomFamilyStateValue(
    metadataStoreState,
    'objectMetadataItems',
  );

  if (isMobile) {
    return <MobileHomePage />;
  }
  if (metadataStore.status !== 'up-to-date') {
    return <RecordIndexSkeletonLoader />;
  }
  return <HomePageContent />;
};
