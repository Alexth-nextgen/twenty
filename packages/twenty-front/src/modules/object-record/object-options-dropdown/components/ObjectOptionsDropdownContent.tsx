import { ObjectOptionsDropdownAddRecordGroupContent } from '@/object-record/object-options-dropdown/components/ObjectOptionsDropdownAddRecordGroupContent';
import { ObjectOptionsDropdownCalendarFieldsContent } from '@/object-record/object-options-dropdown/components/ObjectOptionsDropdownCalendarFieldsContent';
import { ObjectOptionsDropdownCalendarViewContent } from '@/object-record/object-options-dropdown/components/ObjectOptionsDropdownCalendarViewContent';
import { ObjectOptionsDropdownFieldsContent } from '@/object-record/object-options-dropdown/components/ObjectOptionsDropdownFieldsContent';
import { ObjectOptionsDropdownHiddenFieldsContent } from '@/object-record/object-options-dropdown/components/ObjectOptionsDropdownHiddenFieldsContent';
import { ObjectOptionsDropdownHiddenRecordGroupsContent } from '@/object-record/object-options-dropdown/components/ObjectOptionsDropdownHiddenRecordGroupsContent';
import { ObjectOptionsDropdownLayoutContent } from '@/object-record/object-options-dropdown/components/ObjectOptionsDropdownLayoutContent';
import { ObjectOptionsDropdownMenuContent } from '@/object-record/object-options-dropdown/components/ObjectOptionsDropdownMenuContent';
import { ObjectOptionsDropdownRecordGroupFieldsContent } from '@/object-record/object-options-dropdown/components/ObjectOptionsDropdownRecordGroupFieldsContent';
import { ObjectOptionsDropdownRecordGroupLoadLimitContent } from '@/object-record/object-options-dropdown/components/ObjectOptionsDropdownRecordGroupLoadLimitContent';
import { ObjectOptionsDropdownRecordGroupsContent } from '@/object-record/object-options-dropdown/components/ObjectOptionsDropdownRecordGroupsContent';
import { ObjectOptionsDropdownRecordGroupSortContent } from '@/object-record/object-options-dropdown/components/ObjectOptionsDropdownRecordGroupSortContent';
import { ObjectOptionsDropdownVisibilityContent } from '@/object-record/object-options-dropdown/components/ObjectOptionsDropdownVisibilityContent';
import { LegacyDropdownContent } from '@/ui/layout/dropdown/components/LegacyDropdownContent';
import { DropdownMenuHeader } from '@/ui/layout/dropdown/components/DropdownMenuHeader/DropdownMenuHeader';
import { DropdownMenuHeaderLeftComponent } from '@/ui/layout/dropdown/components/DropdownMenuHeader/internal/DropdownMenuHeaderLeftComponent';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';
import { IconChevronLeft } from 'twenty-ui/icon';
import { useObjectOptionsDropdown } from '@/object-record/object-options-dropdown/hooks/useObjectOptionsDropdown';

export const ObjectOptionsDropdownContent = () => {
  const { currentContentId, additionalPage, resetContent } =
    useObjectOptionsDropdown();

  switch (currentContentId) {
    case 'layout':
      return <ObjectOptionsDropdownLayoutContent />;
    case 'fields':
      return <ObjectOptionsDropdownFieldsContent />;
    case 'hiddenFields':
      return <ObjectOptionsDropdownHiddenFieldsContent />;
    case 'recordGroups':
      return <ObjectOptionsDropdownRecordGroupsContent />;
    case 'recordGroupFields':
      return <ObjectOptionsDropdownRecordGroupFieldsContent />;
    case 'recordGroupSort':
      return <ObjectOptionsDropdownRecordGroupSortContent />;
    case 'recordGroupLoadLimit':
      return <ObjectOptionsDropdownRecordGroupLoadLimitContent />;
    case 'hiddenRecordGroups':
      return <ObjectOptionsDropdownHiddenRecordGroupsContent />;
    case 'addRecordGroup':
      return <ObjectOptionsDropdownAddRecordGroupContent />;
    case 'calendarView':
      return <ObjectOptionsDropdownCalendarViewContent />;
    case 'calendarFields':
      return <ObjectOptionsDropdownCalendarFieldsContent />;
    case 'visibility':
      return <ObjectOptionsDropdownVisibilityContent />;
    case 'additional':
      if (!additionalPage) {
        return <ObjectOptionsDropdownMenuContent />;
      }

      return (
        <LegacyDropdownContent
          widthInPixels={GenericDropdownContentWidth.Large}
        >
          <DropdownMenuHeader
            StartComponent={
              <DropdownMenuHeaderLeftComponent
                onClick={resetContent}
                Icon={IconChevronLeft}
              />
            }
          >
            {additionalPage.label}
          </DropdownMenuHeader>
          {additionalPage.content}
        </LegacyDropdownContent>
      );
    default:
      return <ObjectOptionsDropdownMenuContent />;
  }
};
