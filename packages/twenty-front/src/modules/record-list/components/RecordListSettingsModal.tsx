import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, LightIconButton } from 'twenty-ui/input';
import { IconX } from 'twenty-ui/icon';
import { ModalContent, ModalFooter, ModalHeader } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { RECORD_LIST_SETTINGS_MODAL_ID } from '@/record-list/constants/RecordListSettingsModalId';
import { useDeleteRecordList } from '@/record-list/hooks/useDeleteRecordList';
import { useUpdateRecordList } from '@/record-list/hooks/useUpdateRecordList';
import { type RecordList } from '@/record-list/types/RecordList';
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
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledLabel = styled.label`
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
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
`;

const StyledObjectType = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledFooter = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const StyledActions = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

type RecordListSettingsModalProps = {
  recordList: RecordList;
  objectLabelPlural: string;
};

export const RecordListSettingsModal = ({
  recordList,
  objectLabelPlural,
}: RecordListSettingsModalProps) => {
  const [name, setName] = useState(recordList.name);
  const [isDeleteConfirmationVisible, setIsDeleteConfirmationVisible] =
    useState(false);
  const { updateRecordList, loading: isUpdating } = useUpdateRecordList(
    recordList.id,
  );
  const { deleteRecordList, loading: isDeleting } = useDeleteRecordList();
  const { closeModal } = useModal();
  const { enqueueErrorSnackBar } = useSnackBar();
  const navigate = useNavigate();

  const handleSave = async () => {
    try {
      await updateRecordList({ name: name.trim() });
      closeModal(RECORD_LIST_SETTINGS_MODAL_ID);
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to update list` });
    }
  };

  const handleDelete = async () => {
    if (!isDeleteConfirmationVisible) {
      setIsDeleteConfirmationVisible(true);
      return;
    }

    try {
      await deleteRecordList(recordList.id);
      closeModal(RECORD_LIST_SETTINGS_MODAL_ID);
      navigate('/');
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to delete list` });
    }
  };

  return (
    <ModalStatefulWrapper
      modalInstanceId={RECORD_LIST_SETTINGS_MODAL_ID}
      isClosable
      size="medium"
      renderInDocumentBody
      autoHeight
    >
      <ModalHeader hasBorderBottom>
        <StyledHeader>
          <span>{t`List settings`}</span>
          <LightIconButton
            Icon={IconX}
            aria-label={t`Close`}
            accent="tertiary"
            size="small"
            onClick={() => closeModal(RECORD_LIST_SETTINGS_MODAL_ID)}
          />
        </StyledHeader>
      </ModalHeader>
      <ModalContent>
        <StyledContent>
          <StyledLabel>
            {t`List name`}
            <StyledInput
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </StyledLabel>
          <StyledObjectType>
            {t`Object type: ${objectLabelPlural}`}
          </StyledObjectType>
        </StyledContent>
      </ModalContent>
      <ModalFooter>
        <StyledFooter>
          <Button
            title={
              isDeleteConfirmationVisible ? t`Confirm delete` : t`Delete list`
            }
            accent="danger"
            variant="secondary"
            isLoading={isDeleting}
            onClick={() => void handleDelete()}
          />
          <StyledActions>
            <Button
              title={t`Cancel`}
              variant="secondary"
              onClick={() => closeModal(RECORD_LIST_SETTINGS_MODAL_ID)}
            />
            <Button
              title={t`Save`}
              accent="blue"
              disabled={name.trim().length === 0}
              isLoading={isUpdating}
              onClick={() => void handleSave()}
            />
          </StyledActions>
        </StyledFooter>
      </ModalFooter>
    </ModalStatefulWrapper>
  );
};
