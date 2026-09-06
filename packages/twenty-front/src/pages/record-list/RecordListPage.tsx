import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useParams } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';
import { Button, LightIconButton } from 'twenty-ui/input';
import { IconList, IconPlus, IconSettings, useIcons } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { AddRecordToListModal } from '@/record-list/components/AddRecordToListModal';
import { RecordListEntriesTable } from '@/record-list/components/RecordListEntriesTable';
import { RecordListSettingsModal } from '@/record-list/components/RecordListSettingsModal';
import { ADD_RECORD_TO_LIST_MODAL_ID } from '@/record-list/constants/AddRecordToListModalId';
import { RECORD_LIST_SETTINGS_MODAL_ID } from '@/record-list/constants/RecordListSettingsModalId';
import { useRecordList } from '@/record-list/hooks/useRecordList';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { useModal } from '@/ui/layout/modal/hooks/useModal';

const StyledStatus = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex: 1;
  justify-content: center;
`;

export const RecordListPage = () => {
  const { recordListId = '' } = useParams<{ recordListId: string }>();
  const { recordList, loading } = useRecordList(recordListId);
  const { findObjectMetadataItemById } = useFilteredObjectMetadataItems();
  const { openModal } = useModal();
  const { getIcon } = useIcons();

  if (loading) {
    return <StyledStatus>{t`Loading list…`}</StyledStatus>;
  }

  if (!isDefined(recordList)) {
    return <StyledStatus>{t`List not found`}</StyledStatus>;
  }

  const parentObjectMetadataItem = findObjectMetadataItemById(
    recordList.parentObjectMetadataId,
  );

  if (!isDefined(parentObjectMetadataItem)) {
    return <StyledStatus>{t`List object not found`}</StyledStatus>;
  }

  const ListIcon = isDefined(recordList.icon)
    ? getIcon(recordList.icon)
    : IconList;

  return (
    <PageCardLayout
      header={
        <PageHeader title={recordList.name} Icon={ListIcon}>
          <LightIconButton
            Icon={IconSettings}
            aria-label={t`List settings`}
            accent="tertiary"
            size="small"
            onClick={() => openModal(RECORD_LIST_SETTINGS_MODAL_ID)}
          />
          <Button
            title={t`Add records`}
            Icon={IconPlus}
            accent="blue"
            size="small"
            onClick={() => openModal(ADD_RECORD_TO_LIST_MODAL_ID)}
          />
        </PageHeader>
      }
    >
      <RecordListEntriesTable
        recordListId={recordList.id}
        objectNameSingular={parentObjectMetadataItem.nameSingular}
      />
      <AddRecordToListModal
        recordListId={recordList.id}
        objectNameSingular={parentObjectMetadataItem.nameSingular}
        objectLabelPlural={parentObjectMetadataItem.labelPlural}
      />
      <RecordListSettingsModal
        recordList={recordList}
        objectLabelPlural={parentObjectMetadataItem.labelPlural}
      />
    </PageCardLayout>
  );
};
