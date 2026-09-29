import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { type ReactNode } from 'react';

type NativeAppModalContextValue = {
  closeModal: (modalId: string) => void;
  isModalOpen: (modalId: string) => boolean;
  openModal: (modalId: string) => void;
};

const NativeAppModalContext = createContext<NativeAppModalContextValue | null>(
  null,
);

export const NativeAppModalProvider = ({ children }: { children: ReactNode }) => {
  const [openModalIds, setOpenModalIds] = useState<string[]>([]);
  const openModal = useCallback((modalId: string) => {
    setOpenModalIds((current) =>
      current.includes(modalId) ? current : [...current, modalId],
    );
  }, []);
  const closeModal = useCallback((modalId: string) => {
    setOpenModalIds((current) => current.filter((id) => id !== modalId));
  }, []);
  const value = useMemo(
    () => ({
      closeModal,
      isModalOpen: (modalId: string) => openModalIds.includes(modalId),
      openModal,
    }),
    [closeModal, openModal, openModalIds],
  );

  return (
    <NativeAppModalContext.Provider value={value}>
      {children}
    </NativeAppModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(NativeAppModalContext);

  if (!context) {
    throw new Error('Native app modal provider is missing');
  }

  return context;
};
