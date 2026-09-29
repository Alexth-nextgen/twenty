import { t } from '@lingui/core/macro';
import { type ReactNode } from 'react';
import { Button } from 'twenty-ui/primitives/input';
import { Dialog } from 'twenty-ui/primitives/surfaces';
import { useModal } from '../hooks/useModal';

type ConfirmationModalProps = {
  modalInstanceId: string;
  title: string;
  subtitle: ReactNode;
  onConfirmClick: () => void;
  confirmButtonText: string;
  loading?: boolean;
  onClose: () => void;
};

export const ConfirmationModal = ({
  modalInstanceId,
  title,
  subtitle,
  onConfirmClick,
  confirmButtonText,
  loading = false,
  onClose,
}: ConfirmationModalProps) => {
  const { isModalOpen } = useModal();

  return (
    <Dialog.Root open={isModalOpen(modalInstanceId)} onOpenChange={onClose}>
      <Dialog.Popup aria-label={title} size="sm">
        <Dialog.Header>
          <Dialog.Title>{title}</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>{subtitle}</Dialog.Body>
        <Dialog.Footer>
          <Button variant="outline" onClick={onClose}>
            {t`Cancel`}
          </Button>
          <Button
            color="danger"
            loading={loading}
            onClick={onConfirmClick}
          >
            {confirmButtonText}
          </Button>
        </Dialog.Footer>
      </Dialog.Popup>
    </Dialog.Root>
  );
};
