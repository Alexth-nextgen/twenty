import { type AppErrorDisplayProps } from '@/error-handler/types/AppErrorDisplayProps';
import { AnimatedPlaceholder } from '@/ui/feedback/empty-state/components/AnimatedPlaceholder/AnimatedPlaceholder';
import { EmptyState } from '@/ui/feedback/empty-state/components/EmptyState';
import { t } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { IconRefresh } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledErrorDetail = styled.pre`
  color: ${themeCssVariables.font.color.tertiary};
  font-family: monospace;
  font-size: ${themeCssVariables.font.size.sm};
  margin: ${themeCssVariables.spacing[3]} 0 0;
  max-width: 100%;
  overflow-wrap: anywhere;
  text-align: left;
  white-space: pre-wrap;
`;

export const AppErrorDisplay = ({
  error,
  resetErrorBoundary,
  title = t`Sorry, something went wrong`,
}: AppErrorDisplayProps) => {
  return (
    <EmptyState.Root>
      <AnimatedPlaceholder type="errorIndex" />
      <EmptyState.Content>
        <EmptyState.Title>{title}</EmptyState.Title>
        <EmptyState.Description>
          {t`Please refresh the page.`}
        </EmptyState.Description>
        {import.meta.env.DEV && (
          <StyledErrorDetail>{error.message}</StyledErrorDetail>
        )}
      </EmptyState.Content>
      <Button
        startIcon={<IconRefresh />}
        onClick={resetErrorBoundary}
        variant="outline"
      >{t`Reload`}</Button>
    </EmptyState.Root>
  );
};
