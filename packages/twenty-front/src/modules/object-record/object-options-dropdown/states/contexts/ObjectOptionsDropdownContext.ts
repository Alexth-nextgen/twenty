import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type ObjectOptionsContentId } from '@/object-record/object-options-dropdown/types/ObjectOptionsContentId';
import { type ViewType } from '@/views/types/ViewType';
import { type DraggableListDropResult } from '@/ui/layout/draggable-list/types/DraggableListDropResult';
import { type ReactNode, createContext } from 'react';

export type ObjectOptionsDropdownAdditionalPage = {
  label: string;
  content: ReactNode;
};

export type ObjectOptionsDropdownContextValue = {
  recordIndexId: string;
  objectMetadataItem: EnrichedObjectMetadataItem;
  viewType: ViewType;
  currentContentId: ObjectOptionsContentId | null;
  onContentChange: (key: ObjectOptionsContentId) => void;
  resetContent: () => void;
  dropdownId: string;
  handleRecordGroupOrderChangeWithModal?: (
    result: DraggableListDropResult,
  ) => void;
  additionalPage?: ObjectOptionsDropdownAdditionalPage;
};

export const ObjectOptionsDropdownContext =
  createContext<ObjectOptionsDropdownContextValue>(
    {} as ObjectOptionsDropdownContextValue,
  );
