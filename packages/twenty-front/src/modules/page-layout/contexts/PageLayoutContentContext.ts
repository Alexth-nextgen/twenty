import { type ReactNode } from 'react';
import { type TabPresentation } from '@/page-layout/types/TabPresentation';
import { type PageLayoutTabLayoutMode } from '~/generated-metadata/graphql';
import { createRequiredContext } from '~/utils/createRequiredContext';

export type PageLayoutContentContextType = {
  tabId: string;
  layoutMode: PageLayoutTabLayoutMode;
  presentation: TabPresentation;
  contentAfterWidget?: {
    widgetTitle: string;
    element: ReactNode;
  };
};

export const [PageLayoutContentProvider, usePageLayoutContentContext] =
  createRequiredContext<PageLayoutContentContextType>(
    'PageLayoutContentContext',
  );
