import { MobileHomeAiChatSection } from '@/ai/components/MobileHomeAiChatSection';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useHomePagePreferences } from '@/home/hooks/useHomePagePreferences';
import { usePersonalWorkspaceItems } from '@/home/hooks/usePersonalWorkspaceItems';
import { MainNavigationDrawerNavigationContent } from '@/navigation/components/MainNavigationDrawerNavigationContent';
import { useDefaultHomePagePath } from '@/navigation/hooks/useDefaultHomePagePath';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { MultiWorkspaceDropdownButton } from '@/ui/navigation/navigation-drawer/components/MultiWorkspaceDropdown/MultiWorkspaceDropdownButton';
import { NavigationDrawerFixedContent } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerFixedContent';
import { NavigationDrawerScrollableContent } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerScrollableContent';
import { useIsMobile } from 'twenty-ui/utilities';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Navigate } from 'react-router-dom';
import { themeCssVariables } from 'twenty-ui/theme';
import {
  IconAlertTriangle,
  IconCalendarEvent,
  IconChartBar,
  IconCheckbox,
  IconCurrencyDollar,
} from 'twenty-ui/icon';
import { PermissionFlagType } from '~/generated-metadata/graphql';

const StyledContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  height: 100%;
  min-height: 0;
  padding: ${themeCssVariables.spacing[2]} 0 ${themeCssVariables.spacing[4]};
  width: 100%;
`;

const StyledSections = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledDashboard = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  margin: 0;
`;

const StyledPriorityCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.lg};
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledPriorityRow = styled.div<{ warning?: boolean }>`
  align-items: center;
  color: ${({ warning }) =>
    warning
      ? themeCssVariables.color.red
      : themeCssVariables.font.color.primary};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledKpiGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: 1fr;
`;

const StyledKpiCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.lg};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[3]};
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
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

export const MobileHomePage = () => {
  const { t } = useLingui();
  const isMobile = useIsMobile();
  const { defaultHomePagePath } = useDefaultHomePagePath();
  const hasAiPermission = useHasPermissionFlag(PermissionFlagType.AI);
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const homePagePreferences = useHomePagePreferences();
  const {
    areCalendarEventsLoading,
    areMessageCampaignsLoading,
    areOpportunitiesLoading,
    areTasksLoading,
    messageCampaigns,
    monthMeetings,
    opportunities,
    overdueTasks,
    tasks,
    weekMeetings,
  } = usePersonalWorkspaceItems();
  const dashboardPeriod = homePagePreferences.dashboardPeriod ?? 'week';
  const meetings = dashboardPeriod === 'week' ? weekMeetings : monthMeetings;
  const personalOpportunities = opportunities.filter(
    (opportunity) => opportunity.ownerId === currentWorkspaceMember?.id,
  );
  const sentCount = messageCampaigns.reduce(
    (total, campaign) => total + campaign.sentCount,
    0,
  );
  const deliveryRate =
    sentCount === 0
      ? 0
      : Math.round(
          (messageCampaigns.reduce(
            (total, campaign) => total + campaign.deliveredCount,
            0,
          ) /
            sentCount) *
            100,
        );
  const isDashboardLoading =
    areCalendarEventsLoading ||
    areMessageCampaignsLoading ||
    areOpportunitiesLoading ||
    areTasksLoading;

  // Desktop keeps the drawer, so the page has nothing to show there.
  if (!isMobile) {
    return <Navigate to={defaultHomePagePath} replace />;
  }

  return (
    <StyledContainer>
      <NavigationDrawerFixedContent>
        <MultiWorkspaceDropdownButton />
      </NavigationDrawerFixedContent>

      <NavigationDrawerScrollableContent>
        <StyledSections>
          <MainNavigationDrawerNavigationContent />
          {hasAiPermission && <MobileHomeAiChatSection />}
          <StyledDashboard>
            <StyledTitle>{t`Important today`}</StyledTitle>
            <StyledPriorityCard>
              {isDashboardLoading ? (
                <span>{t`Loading dashboard…`}</span>
              ) : overdueTasks.length === 0 ? (
                <StyledPriorityRow>
                  <IconCheckbox size={16} />
                  <span>{t`Everything important is on track.`}</span>
                </StyledPriorityRow>
              ) : (
                <StyledPriorityRow warning>
                  <IconAlertTriangle size={16} />
                  <span>{t`${overdueTasks.length} overdue tasks need attention`}</span>
                </StyledPriorityRow>
              )}
            </StyledPriorityCard>
            <StyledTitle>{t`My performance`}</StyledTitle>
            <StyledKpiGrid>
              <StyledKpiCard>
                <StyledKpiLabel>
                  <IconCheckbox size={16} /> {t`Open tasks`}
                </StyledKpiLabel>
                <StyledKpiValue>{tasks.length}</StyledKpiValue>
              </StyledKpiCard>
              <StyledKpiCard>
                <StyledKpiLabel>
                  <IconCalendarEvent size={16} /> {t`Meetings`}
                </StyledKpiLabel>
                <StyledKpiValue>{meetings.length}</StyledKpiValue>
              </StyledKpiCard>
              <StyledKpiCard>
                <StyledKpiLabel>
                  <IconCurrencyDollar size={16} /> {t`Pipeline`}
                </StyledKpiLabel>
                <StyledKpiValue>{personalOpportunities.length}</StyledKpiValue>
              </StyledKpiCard>
              <StyledKpiCard>
                <StyledKpiLabel>
                  <IconChartBar size={16} /> {t`Delivery`}
                </StyledKpiLabel>
                <StyledKpiValue>
                  {sentCount > 0 ? `${deliveryRate}%` : '—'}
                </StyledKpiValue>
              </StyledKpiCard>
            </StyledKpiGrid>
          </StyledDashboard>
        </StyledSections>
      </NavigationDrawerScrollableContent>
    </StyledContainer>
  );
};
