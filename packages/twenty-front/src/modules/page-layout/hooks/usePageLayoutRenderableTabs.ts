import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useCurrentPageLayoutOrThrow } from '@/page-layout/hooks/useCurrentPageLayoutOrThrow';
import { useIsPageLayoutInEditMode } from '@/page-layout/hooks/useIsPageLayoutInEditMode';
import { useWidgetVisibilityContext } from '@/page-layout/hooks/useWidgetVisibilityContext';
import { getIsFirstTabPinned } from '@/page-layout/utils/getIsFirstTabPinned';
import { getTabsByDisplayMode } from '@/page-layout/utils/getTabsByDisplayMode';
import { getTabsRenderableForTargetObject } from '@/page-layout/utils/getTabsRenderableForTargetObject';
import { getTabsWithVisibleWidgets } from '@/page-layout/utils/getTabsWithVisibleWidgets';
import { isFieldWidget } from '@/page-layout/widgets/field/utils/isFieldWidget';
import { isRecordListMembershipRelationField } from '@/page-layout/widgets/fields/utils/isRecordListMembershipRelationField';
import { useLayoutRenderingContext } from '@/ui/layout/contexts/LayoutRenderingContext';
import { useWorkspaceSurface } from '@/ui/layout/hooks/useWorkspaceSurface';
import { isDefined } from 'twenty-shared/utils';
import { useIsMobile } from 'twenty-ui/utilities';

// Single source of truth for which tabs render and which one is pinned, so
// every consumer derives them from the same filtered tab set.
export const usePageLayoutRenderableTabs = () => {
  const isMobile = useIsMobile();
  const { targetRecordIdentifier } = useLayoutRenderingContext();
  const isInSidePanel = useWorkspaceSurface().type === 'side-panel';
  const { currentPageLayout } = useCurrentPageLayoutOrThrow();
  const isPageLayoutInEditMode = useIsPageLayoutInEditMode();
  const { objectMetadataItems } = useObjectMetadataItems();
  const widgetVisibilityContext = useWidgetVisibilityContext();

  const targetObjectMetadataItem = isDefined(targetRecordIdentifier)
    ? objectMetadataItems.find(
        (item) =>
          item.nameSingular === targetRecordIdentifier.targetObjectNameSingular,
      )
    : undefined;

  const tabsWithVisibleWidgets = getTabsWithVisibleWidgets({
    tabs: currentPageLayout.tabs,
    isEditMode: isPageLayoutInEditMode,
    context: widgetVisibilityContext,
  });

  // Edit mode keeps every tab visible (like getTabsWithVisibleWidgets) so a
  // widget the object does not support can still be reached and removed.
  const renderableTabs = isPageLayoutInEditMode
    ? tabsWithVisibleWidgets
    : getTabsRenderableForTargetObject({
        tabs: tabsWithVisibleWidgets,
        targetObjectFields: targetObjectMetadataItem?.fields,
      });

  const tabsForDisplay = isPageLayoutInEditMode
    ? renderableTabs
    : renderableTabs
        .map((tab) => ({
          ...tab,
          widgets: tab.widgets.filter((widget) => {
            if (!isFieldWidget(widget)) {
              return true;
            }

            if (widget.title === 'Lists') {
              return false;
            }

            const fieldMetadataItem = targetObjectMetadataItem?.fields.find(
              (field) =>
                field.id === widget.configuration.fieldMetadataId ||
                field.universalIdentifier ===
                  widget.configuration.fieldMetadataId ||
                field.name === widget.configuration.fieldMetadataId,
            );

            return (
              !isDefined(fieldMetadataItem) ||
              !isRecordListMembershipRelationField(fieldMetadataItem)
            );
          }),
        }));

  const { tabsToRenderInTabList, pinnedLeftTab } = getTabsByDisplayMode({
    tabs: tabsForDisplay,
    pageLayoutType: currentPageLayout.type,
    isMobile,
    isInSidePanel,
    isFirstTabPinned: getIsFirstTabPinned(currentPageLayout),
  });

  return {
    tabsToRenderInTabList,
    pinnedLeftTab,
  };
};
