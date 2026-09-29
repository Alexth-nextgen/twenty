import { type ReactNode } from 'react';
import { Dialog } from 'twenty-ui/primitives/surfaces';
import { useModal } from '../hooks/useModal';

type ModalStatefulWrapperProps = {
  children: ReactNode;
  modalInstanceId: string;
  isClosable?: boolean;
  onClose?: () => void;
  renderInDocumentBody?: boolean;
  size?: 'small' | 'medium' | 'large';
  autoHeight?: boolean;
};

export const ModalStatefulWrapper = ({
  children,
  modalInstanceId,
  isClosable = false,
  onClose,
  renderInDocumentBody = false,
  size = 'medium',
}: ModalStatefulWrapperProps) => {
  const { closeModal, isModalOpen } = useModal();
  const isOpen = isModalOpen(modalInstanceId);
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isClosable) {
      onClose?.();
      closeModal(modalInstanceId);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Popup
        aria-label="List"
        size={size === 'large' ? 'lg' : size === 'small' ? 'sm' : 'md'}
        container={renderInDocumentBody ? document.body : undefined}
      >
        {children}
      </Dialog.Popup>
    </Dialog.Root>
  );
};
