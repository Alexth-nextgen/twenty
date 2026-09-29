import { usePersonalWorkspaceItems } from '@/home/hooks/usePersonalWorkspaceItems';
import { metadataStoreState } from '@/metadata-store/states/metadataStoreState';
import { RecordIndexSkeletonLoader } from '@/object-record/record-index/components/RecordIndexSkeletonLoader';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { PageTitle } from '@/ui/utilities/page-title/components/PageTitle';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppPath, CoreObjectNameSingular } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';
import {
  IconAlertTriangle,
  IconCalendarEvent,
  IconCheckbox,
  IconInbox,
} from 'twenty-ui/icon';
import { MOBILE_VIEWPORT, themeCssVariables, useTheme } from 'twenty-ui/theme';

const INBOX_CONTENT_MAX_WIDTH = 880;

type InboxFilter = 'all' | 'tasks' | 'meetings' | 'workflow-errors';

type InboxItem = {
  id: string;
  kind: Exclude<InboxFilter, 'all'>;
  label: string;
  timestamp: string | null;
  to: string;
};

const StyledContent = styled.div`
  align-self: center;
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[6]};
  max-width: ${INBOX_CONTENT_MAX_WIDTH}px;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[10]} ${themeCssVariables.spacing[8]};
  width: 100%;

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    padding: ${themeCssVariables.spacing[6]} ${themeCssVariables.spacing[4]};
  }
`;

const StyledIntro = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledTitle = styled.h1`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xxl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledSubtitle = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  margin: 0;
`;

const StyledFilters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledFilterButton = styled.button<{ active: boolean }>`
  background: ${({ active }) =>
    active
      ? themeCssVariables.background.transparent.medium
      : themeCssVariables.background.primary};
  border: 1px solid
    ${({ active }) =>
      active
        ? themeCssVariables.border.color.strong
        : themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font-family: inherit;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledList = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.lg};
  overflow: hidden;
`;

const StyledItem = styled(Link)`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  min-height: 64px;
  padding: 0 ${themeCssVariables.spacing[4]};
  text-decoration: none;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledItemText = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledItemLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledItemMeta = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledEmptyState = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: center;
  min-height: 240px;
`;

const InboxPageContent = () => {
  const { t } = useLingui();
  const theme = useTheme();
  const [activeFilter, setActiveFilter] = useState<InboxFilter>('all');
  const {
    areCalendarEventsLoading,
    areTasksLoading,
    areWorkflowRunsLoading,
    failedWorkflowRuns,
    meetings,
    tasks,
  } = usePersonalWorkspaceItems();

  const items = useMemo<InboxItem[]>(
    () =>
      [
        ...tasks.map((task) => ({
          id: task.id,
          kind: 'tasks' as const,
          label: task.title || t`Untitled task`,
          timestamp: task.dueAt,
          to: getAppPath(AppPath.RecordShowPage, {
            objectNameSingular: CoreObjectNameSingular.Task,
            objectRecordId: task.id,
          }),
        })),
        ...meetings.map((meeting) => ({
          id: meeting.id,
          kind: 'meetings' as const,
          label: meeting.title || t`Untitled meeting`,
          timestamp: meeting.startsAt,
          to: getAppPath(AppPath.RecordShowPage, {
            objectNameSingular: CoreObjectNameSingular.CalendarEvent,
            objectRecordId: meeting.id,
          }),
        })),
        ...failedWorkflowRuns.map((workflowRun) => ({
          id: workflowRun.id,
          kind: 'workflow-errors' as const,
          label: workflowRun.name || t`Workflow run failed`,
          timestamp: workflowRun.endedAt,
          to: getAppPath(AppPath.RecordShowPage, {
            objectNameSingular: CoreObjectNameSingular.WorkflowRun,
            objectRecordId: workflowRun.id,
          }),
        })),
      ].sort((firstItem, secondItem) => {
        if (!isDefined(firstItem.timestamp)) {
          return 1;
        }
        if (!isDefined(secondItem.timestamp)) {
          return -1;
        }
        return (
          new Date(firstItem.timestamp).getTime() -
          new Date(secondItem.timestamp).getTime()
        );
      }),
    [failedWorkflowRuns, meetings, t, tasks],
  );

  const filteredItems = items.filter(
    (item) => activeFilter === 'all' || item.kind === activeFilter,
  );
  const isLoading =
    areCalendarEventsLoading || areTasksLoading || areWorkflowRunsLoading;

  const filterOptions: Array<{ id: InboxFilter; label: string }> = [
    { id: 'all', label: t`All` },
    { id: 'tasks', label: t`Tasks` },
    { id: 'meetings', label: t`Meetings` },
    { id: 'workflow-errors', label: t`Workflow issues` },
  ];

  const getItemIcon = (kind: InboxItem['kind']) => {
    switch (kind) {
      case 'tasks':
        return IconCheckbox;
      case 'meetings':
        return IconCalendarEvent;
      case 'workflow-errors':
        return IconAlertTriangle;
    }
  };

  const getItemMeta = (item: InboxItem) => {
    const typeLabel =
      item.kind === 'tasks'
        ? t`Task`
        : item.kind === 'meetings'
          ? t`Meeting`
          : t`Workflow issue`;

    return isDefined(item.timestamp)
      ? `${typeLabel} · ${format(new Date(item.timestamp), 'PPp')}`
      : typeLabel;
  };

  return (
    <PageCardLayout header={<PageHeader title={t`Inbox`} Icon={IconInbox} />}>
      <PageTitle title={t`Inbox`} />
      <StyledContent>
        <StyledIntro>
          <StyledTitle>{t`Inbox`}</StyledTitle>
          <StyledSubtitle>
            {t`Everything that needs your attention in one place.`}
          </StyledSubtitle>
        </StyledIntro>

        <StyledFilters>
          {filterOptions.map((filterOption) => (
            <StyledFilterButton
              key={filterOption.id}
              active={activeFilter === filterOption.id}
              onClick={() => setActiveFilter(filterOption.id)}
              type="button"
            >
              {filterOption.label}
            </StyledFilterButton>
          ))}
        </StyledFilters>

        <StyledList>
          {isLoading ? (
            <StyledEmptyState>{t`Loading inbox…`}</StyledEmptyState>
          ) : filteredItems.length === 0 ? (
            <StyledEmptyState>
              <IconInbox size={theme.icon.size.lg} />
              <span>{t`Nothing needs your attention here.`}</span>
            </StyledEmptyState>
          ) : (
            filteredItems.map((item) => {
              const ItemIcon = getItemIcon(item.kind);
              return (
                <StyledItem key={`${item.kind}-${item.id}`} to={item.to}>
                  <ItemIcon size={theme.icon.size.md} />
                  <StyledItemText>
                    <StyledItemLabel>{item.label}</StyledItemLabel>
                    <StyledItemMeta>{getItemMeta(item)}</StyledItemMeta>
                  </StyledItemText>
                </StyledItem>
              );
            })
          )}
        </StyledList>
      </StyledContent>
    </PageCardLayout>
  );
};

export const InboxPage = () => {
  const metadataStore = useAtomFamilyStateValue(
    metadataStoreState,
    'objectMetadataItems',
  );

  if (metadataStore.status !== 'up-to-date') {
    return <RecordIndexSkeletonLoader />;
  }

  return <InboxPageContent />;
};
