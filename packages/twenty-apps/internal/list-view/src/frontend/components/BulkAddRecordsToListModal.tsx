import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { Button } from 'twenty-ui/primitives/input';
import { LightIconButton } from 'twenty-ui/components';
import { IconList, IconPlus, IconX, useIcons } from 'twenty-ui/icon';
import { Dialog } from 'twenty-ui/primitives/surfaces';
import { themeCssVariables } from 'twenty-ui/theme';

import { useAddRecordsToList } from '../hooks/useAddRecordsToList';
import { useCreateRecordList } from '../hooks/useCreateRecordList';
import { useRecordLists } from '../hooks/useRecordLists';
import { useSnackBar } from '@/app/native-extension-host/api/modules/ui/feedback/snack-bar-manager/hooks/useSnackBar';

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const StyledContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledDescription = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledListButton = styled.button<{ selected: boolean }>`
  align-items: center;
  background: ${({ selected }) =>
    selected
      ? themeCssVariables.background.transparent.blue
      : themeCssVariables.background.secondary};
  border: 1px solid
    ${({ selected }) =>
      selected
        ? themeCssVariables.color.blue
        : themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[2]};
  min-height: 40px;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  text-align: left;

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
    outline-offset: 2px;
  }
`;

const StyledInput = styled.input`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.md};
  min-height: 40px;
  padding: 0 ${themeCssVariables.spacing[3]};

  &:focus {
    border-color: ${themeCssVariables.color.blue};
    outline: none;
  }
`;

type BulkAddRecordsToListModalProps = {
  objectMetadataId: string;
  recordIds: string[];
  onClose: () => void;
};

export const BulkAddRecordsToListModal = ({
  objectMetadataId,
  recordIds,
  onClose,
}: BulkAddRecordsToListModalProps) => {
  const [selectedRecordListId, setSelectedRecordListId] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { recordLists, loading: areRecordListsLoading } = useRecordLists();
  const { addRecordsToList, loading: isAdding } = useAddRecordsToList();
  const { createRecordList, loading: isCreating } = useCreateRecordList();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const { getIcon } = useIcons();

  const matchingRecordLists = recordLists.filter(
    (recordList) => recordList.parentObjectMetadataId === objectMetadataId,
  );
  const filteredRecordLists = matchingRecordLists.filter((recordList) =>
    recordList.name
      .toLocaleLowerCase()
      .includes(searchQuery.trim().toLocaleLowerCase()),
  );

  const handleSubmit = async () => {
    try {
      let recordListId = selectedRecordListId;

      if (isCreatingList) {
        const recordList = await createRecordList({
          name: newListName.trim(),
          icon: 'IconList',
          parentObjectMetadataId: objectMetadataId,
        });

        if (!isDefined(recordList)) {
          throw new Error('List creation did not return a list');
        }

        recordListId = recordList.id;
      }

      const result = await addRecordsToList({
        recordListId,
        sourceRecordIds: recordIds,
        parentObjectMetadataId: objectMetadataId,
      });

      if (!isDefined(result)) {
        throw new Error('Bulk list assignment did not return a result');
      }

      enqueueSuccessSnackBar({
        message:
          result.skippedCount > 0
            ? t`${result.addedCount} records added; ${result.skippedCount} already in list`
            : t`${result.addedCount} records added to list`,
      });
      onClose();
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to add records to list` });
    }
  };

  const canSubmit = isCreatingList
    ? newListName.trim().length > 0
    : selectedRecordListId.length > 0;

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Popup
        aria-label={t`Add to List`}
        container={document.body}
        size="md"
      >
      <Dialog.Header>
        <StyledHeader>
          <span>{t`Add to List`}</span>
          <LightIconButton
            aria-label={t`Close`}
            size="sm"
            onClick={onClose}
          >
            <IconX />
          </LightIconButton>
        </StyledHeader>
      </Dialog.Header>
      <Dialog.Body>
        <StyledContent>
          <StyledDescription>
            {t`Add ${recordIds.length} selected records to a list.`}
          </StyledDescription>
          {isCreatingList ? (
            <StyledInput
              autoFocus
              value={newListName}
              placeholder={t`New list name`}
              onChange={(event) => setNewListName(event.target.value)}
            />
          ) : (
            <>
              <StyledInput
                aria-label={t`Search lists`}
                value={searchQuery}
                placeholder={t`Search lists...`}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              {filteredRecordLists.map((recordList) => {
                const RecordListIcon = isDefined(recordList.icon)
                  ? getIcon(recordList.icon)
                  : IconList;

                return (
                  <StyledListButton
                    key={recordList.id}
                    type="button"
                    selected={selectedRecordListId === recordList.id}
                    aria-pressed={selectedRecordListId === recordList.id}
                    onClick={() => setSelectedRecordListId(recordList.id)}
                  >
                    <RecordListIcon size={16} />
                    {recordList.name}
                  </StyledListButton>
                );
              })}
              {!areRecordListsLoading && matchingRecordLists.length === 0 && (
                <StyledDescription>
                  {t`No lists available yet.`}
                </StyledDescription>
              )}
              {!areRecordListsLoading &&
                matchingRecordLists.length > 0 &&
                filteredRecordLists.length === 0 && (
                  <StyledDescription>
                    {t`No lists match your search.`}
                  </StyledDescription>
                )}
            </>
          )}
          <Button
            startIcon={isCreatingList ? <IconList /> : <IconPlus />}
            variant="outline"
            onClick={() => {
              setIsCreatingList((currentValue) => !currentValue);
              setSelectedRecordListId('');
            }}
          >
            {isCreatingList ? t`Choose existing list` : t`Create new list`}
          </Button>
        </StyledContent>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="outline" onClick={onClose}>
          {t`Cancel`}
        </Button>
        <Button
          color="accent"
          variant="solid"
          disabled={!canSubmit || areRecordListsLoading}
          loading={isAdding || isCreating}
          onClick={() => void handleSubmit()}
        >
          {t`Add to List`}
        </Button>
      </Dialog.Footer>
      </Dialog.Popup>
    </Dialog.Root>
  );
};
