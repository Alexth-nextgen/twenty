import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { themeCssVariables } from 'twenty-ui/theme';

import { PageCardHeader } from '@/app/native-extension-host/api/modules/ui/layout/page/components/PageCardHeader';
import { PageContainer } from '@/app/native-extension-host/api/modules/ui/layout/page/components/PageContainer';

const StyledContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledLine = styled.div`
  color: ${themeCssVariables.font.color.secondary};
`;

// This app owns no product semantics. It exists to prove that the native app
// host is generic: it registers a route, a navigation entry, a record page
// section and a command without importing any ListView code.
export const HostSamplePage = () => (
  <PageContainer>
    <PageCardHeader title={t`Native host sample`} />
    <StyledContent>
      <StyledLine>{t`This page is provided by a native app.`}</StyledLine>
      <StyledLine>{t`Requested host capability: native-app-host@^1`}</StyledLine>
      <StyledLine>{t`Registered extension points: route, navigation entry, record page section, command, server module.`}</StyledLine>
    </StyledContent>
  </PageContainer>
);
