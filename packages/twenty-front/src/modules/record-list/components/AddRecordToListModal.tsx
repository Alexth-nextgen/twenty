import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useState } from 'react';
import { Button, LightIconButton } from 'twenty-ui/input';
import { IconPlus, IconSearch, IconX } from 'twenty-ui/icon';
import { ModalContent, ModalFooter, ModalHeader } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { useRecordsForSelect } from '@/object-record/select/hooks/useRecordsForSelect';
import { ADD_RECORD_TO_LIST_MODAL_ID } from '@/record-list/constants/AddRecordToListModalId';
import { useRecordListEntries } from '@/record-list/hooks/useRecordListEntries';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { ModalStatefulWrapper } from '@/ui/layout/modal/components/ModalStatefulWrapper';
import { useModal } from '@/ui/layout/modal/hooks/useModal';

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const StyledSearch = styled.div`
  align-items: center;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledSearchInput = styled.input`
  background: transparent;
  border: 0;
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.md};
  min-height: 40px;
  outline: none;
`;

const StyledResults = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  max-height: 360px;
  overflow-y: auto;
`;

const StyledResult = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.md};
  justify-content: space-between;
  min-height: 40px;
  padding: ${themeCssVariables.spacing[2]};
  text-align: left;

  &:hover,
  &:focus-visible {
    background: ${themeCssVariables.background.transparent.light};
    outline: none;
  }
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[6]} ${themeCssVariables.spacing[2]};
  text-align: center;
`;

type AddRecordToListModalProps = {
  recordListId: string;
  objectNameSingular: string;
  objectLabelPlural: string;
};

export const AddRecordToListModal = ({
  recordListId,
  objectNameSingular,
  objectLabelPlural,
}: AddRecordToListModalProps) => {
  const [searchFilterText, setSearchFilterText] = useState('');
  const { closeModal } = useModal();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const { addRecordToList, isAddingRecord } =
    useRecordListEntries(recordListId);
  const { recordsToSelect, loading } = useRecordsForSelect({
    searchFilterText,
    selectedIds: [],
    objectNameSingular,
    allowRequestsToTwentyIcons: true,
  });

  const handleAdd = async (sourceRecordId: string) => {
    try {
      await addRecordToList(sourceRecordId);
      enqueueSuccessSnackBar({ message: t`Record added to list` });
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to add record to list` });
    }
  };

  return (
    <ModalStatefulWrapper
      modalInstanceId={ADD_RECORD_TO_LIST_MODAL_ID}
      isClosable
      size="medium"
      renderInDocumentBody
      autoHeight
    >
      <ModalHeader hasBorderBottom>
        <StyledHeader>
          <span>{t`Add ${objectLabelPlural}`}</span>
          <LightIconButton
            Icon={IconX}
            aria-label={t`Close`}
            accent="tertiary"
            size="small"
            onClick={() => closeModal(ADD_RECORD_TO_LIST_MODAL_ID)}
          />
        </StyledHeader>
      </ModalHeader>
      <ModalContent>
        <StyledSearch>
          <IconSearch size={16} />
          <StyledSearchInput
            autoFocus
            value={searchFilterText}
            placeholder={t`Search ${objectLabelPlural}`}
            onChange={(event) => setSearchFilterText(event.target.value)}
          />
        </StyledSearch>
        <StyledResults>
          {!loading && recordsToSelect.length === 0 ? (
            <StyledEmpty>{t`No records found`}</StyledEmpty>
          ) : (
            recordsToSelect.map((record) => (
              <StyledResult
                key={record.id}
                type="button"
                disabled={isAddingRecord}
                onClick={() => void handleAdd(record.id)}
              >
                <span>{record.name}</span>
                <IconPlus size={16} />
              </StyledResult>
            ))
          )}
        </StyledResults>
      </ModalContent>
      <ModalFooter>
        <Button
          title={t`Done`}
          variant="secondary"
          onClick={() => closeModal(ADD_RECORD_TO_LIST_MODAL_ID)}
        />
      </ModalFooter>
    </ModalStatefulWrapper>
  );
};
