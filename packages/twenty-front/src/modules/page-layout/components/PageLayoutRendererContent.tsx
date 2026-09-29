import { PageLayoutTabsRenderer } from '@/page-layout/components/PageLayoutTabsRenderer';
import { pageLayoutIsInitializedComponentState } from '@/page-layout/states/pageLayoutIsInitializedComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { type ReactNode } from 'react';

export const PageLayoutRendererContent = ({
  contentTrailingElement,
}: {
  contentTrailingElement?: ReactNode;
}) => {
  const pageLayoutIsInitialized = useAtomComponentStateValue(
    pageLayoutIsInitializedComponentState,
  );

  if (!pageLayoutIsInitialized) {
    return null;
  }

  return (
    <PageLayoutTabsRenderer contentTrailingElement={contentTrailingElement} />
  );
};
