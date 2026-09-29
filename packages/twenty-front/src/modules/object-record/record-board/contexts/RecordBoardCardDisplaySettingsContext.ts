import { createContext } from 'react';

export type RecordBoardCardDisplaySettings = {
  showAttributeLabels: boolean;
  hideEmptyAttributes: boolean;
};

export const RecordBoardCardDisplaySettingsContext =
  createContext<RecordBoardCardDisplaySettings>({
    showAttributeLabels: false,
    hideEmptyAttributes: false,
  });
