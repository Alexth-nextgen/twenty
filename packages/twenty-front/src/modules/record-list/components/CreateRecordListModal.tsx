import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';
import { Button, LightIconButton } from 'twenty-ui/input';
import { IconList, IconX, useIcons } from 'twenty-ui/icon';
import { ModalContent, ModalFooter, ModalHeader } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { CREATE_RECORD_LIST_MODAL_ID } from '@/record-list/constants/CreateRecordListModalId';
import { getRecordListPath } from '@/record-list/utils/getRecordListPath';
import { useCreateRecordList } from '@/record-list/hooks/useCreateRecordList';
import { useRecordLists } from '@/record-list/hooks/useRecordLists';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { ModalStatefulWrapper } from '@/ui/layout/modal/components/ModalStatefulWrapper';
import { useModal } from '@/ui/layout/modal/hooks/useModal';

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const StyledContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[5]};
`;

const StyledLabel = styled.label`
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledObjectGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
`;

const StyledObjectButton = styled.button<{ selected: boolean }>`
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
  min-height: 72px;
  padding: ${themeCssVariables.spacing[3]};
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

const StyledFooterActions = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
  width: 100%;
`;

export const CreateRecordListModal = () => {
  const [name, setName] = useState('');
  const [parentObjectMetadataId, setParentObjectMetadataId] = useState('');
  const { activeNonSystemObjectMetadataItems } =
    useFilteredObjectMetadataItems();
  const { recordLists } = useRecordLists();
  const { createRecordList, loading } = useCreateRecordList();
  const { closeModal } = useModal();
  const { enqueueErrorSnackBar } = useSnackBar();
  const { getIcon } = useIcons();
  const navigate = useNavigate();

  const internalEntryObjectIds = new Set(
    recordLists.map((recordList) => recordList.entryObjectMetadataId),
  );
  const availableObjectMetadataItems =
    activeNonSystemObjectMetadataItems.filter(
      (objectMetadataItem) =>
        !internalEntryObjectIds.has(objectMetadataItem.id),
    );

  const handleClose = () => {
    setName('');
    setParentObjectMetadataId('');
    closeModal(CREATE_RECORD_LIST_MODAL_ID);
  };

  const handleCreate = async () => {
    if (name.trim().length === 0 || parentObjectMetadataId.length === 0) {
      return;
    }

    try {
      const recordList = await createRecordList({
        name: name.trim(),
        icon: 'IconList',
        parentObjectMetadataId,
      });

      if (isDefined(recordList)) {
        handleClose();
        navigate(getRecordListPath(recordList.id));
      }
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to create list` });
    }
  };

  return (
    <ModalStatefulWrapper
      modalInstanceId={CREATE_RECORD_LIST_MODAL_ID}
      isClosable
      onClose={handleClose}
      onEnter={() => void handleCreate()}
      size="large"
      renderInDocumentBody
      autoHeight
    >
      <ModalHeader hasBorderBottom>
        <StyledHeader>
          <span>{t`Create list`}</span>
          <LightIconButton
            Icon={IconX}
            aria-label={t`Close`}
            accent="tertiary"
            size="small"
            onClick={handleClose}
          />
        </StyledHeader>
      </ModalHeader>
      <ModalContent>
        <StyledContent>
          <StyledLabel>
            {t`Object`}
            <StyledObjectGrid>
              {availableObjectMetadataItems.map((objectMetadataItem) => {
                const ObjectIcon = isDefined(objectMetadataItem.icon)
                  ? getIcon(objectMetadataItem.icon)
                  : IconList;

                return (
                  <StyledObjectButton
                    key={objectMetadataItem.id}
                    type="button"
                    selected={parentObjectMetadataId === objectMetadataItem.id}
                    onClick={() =>
                      setParentObjectMetadataId(objectMetadataItem.id)
                    }
                  >
                    <ObjectIcon size={20} />
                    {objectMetadataItem.labelPlural}
                  </StyledObjectButton>
                );
              })}
            </StyledObjectGrid>
          </StyledLabel>
          <StyledLabel>
            {t`List name`}
            <StyledInput
              autoFocus
              value={name}
              placeholder={t`New list`}
              onChange={(event) => setName(event.target.value)}
            />
          </StyledLabel>
        </StyledContent>
      </ModalContent>
      <ModalFooter>
        <StyledFooterActions>
          <Button title={t`Cancel`} variant="secondary" onClick={handleClose} />
          <Button
            title={t`Create list`}
            accent="blue"
            disabled={
              name.trim().length === 0 || parentObjectMetadataId.length === 0
            }
            isLoading={loading}
            onClick={() => void handleCreate()}
          />
        </StyledFooterActions>
      </ModalFooter>
    </ModalStatefulWrapper>
  );
};
