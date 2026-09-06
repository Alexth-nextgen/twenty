import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useLocation } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';
import { LightIconButton } from 'twenty-ui/input';
import { IconList, IconPlus, useIcons } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { NavigationMenuItemSection } from '@/navigation-menu-item/display/sections/components/NavigationMenuItemSection';
import { CreateRecordListModal } from '@/record-list/components/CreateRecordListModal';
import { CREATE_RECORD_LIST_MODAL_ID } from '@/record-list/constants/CreateRecordListModalId';
import { getRecordListPath } from '@/record-list/utils/getRecordListPath';
import { useRecordLists } from '@/record-list/hooks/useRecordLists';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { useNavigationSection } from '@/ui/navigation/navigation-drawer/hooks/useNavigationSection';

const StyledList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.betweenSiblingsGap};
  padding-top: ${themeCssVariables.betweenSiblingsGap};
`;

export const RecordListsSection = () => {
  const { t } = useLingui();
  const { recordLists } = useRecordLists();
  const { openModal } = useModal();
  const { getIcon } = useIcons();
  const location = useLocation();
  const { toggleNavigationSection, isNavigationSectionOpen } =
    useNavigationSection('Lists');

  return (
    <>
      <NavigationMenuItemSection
        title={t`Lists`}
        isOpen={isNavigationSectionOpen}
        onToggle={toggleNavigationSection}
        alwaysShowRightIcon
        rightIcon={
          <LightIconButton
            Icon={IconPlus}
            aria-label={t`Create list`}
            accent="tertiary"
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              openModal(CREATE_RECORD_LIST_MODAL_ID);
            }}
          />
        }
      >
        <StyledList>
          {recordLists.map((recordList) => {
            const path = getRecordListPath(recordList.id);
            const ListIcon = isDefined(recordList.icon)
              ? getIcon(recordList.icon)
              : IconList;

            return (
              <NavigationDrawerItem
                key={recordList.id}
                label={recordList.name}
                Icon={ListIcon}
                to={path}
                active={location.pathname === path}
              />
            );
          })}
        </StyledList>
      </NavigationMenuItemSection>
      <CreateRecordListModal />
    </>
  );
};
