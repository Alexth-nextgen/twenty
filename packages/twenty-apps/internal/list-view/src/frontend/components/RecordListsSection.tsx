import { DragDropProvider } from '@dnd-kit/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { t } from '@lingui/core/macro';
import { Fragment, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';
import { LightIconButton } from 'twenty-ui/components';
import {
  IconChevronDown,
  IconChevronUp,
  IconGripVertical,
  IconList,
  IconPlus,
  useIcons,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

import { NavigationMenuItemSection } from '@/app/native-extension-host/api/modules/navigation-menu-item/display/sections/components/NavigationMenuItemSection';
import { CreateRecordListModal } from './CreateRecordListModal';
import { CREATE_RECORD_LIST_MODAL_ID } from '../constants/CreateRecordListModalId';
import { getRecordListPath } from '../utils/getRecordListPath';
import { useRecordLists } from '../hooks/useRecordLists';
import { useModal } from '@/app/native-extension-host/api/modules/ui/layout/modal/hooks/useModal';
import { NavigationDrawerItem } from '@/app/native-extension-host/api/modules/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { useNavigationSection } from '@/app/native-extension-host/api/modules/ui/navigation/navigation-drawer/hooks/useNavigationSection';
import { type RecordList } from '../types/RecordList';
import { useSnackBar } from '@/app/native-extension-host/api/modules/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useReorderRecordLists } from '../hooks/useReorderRecordLists';
import { DragDropItemDropTarget } from '@/app/native-extension-host/api/modules/ui/utilities/drag-and-drop/components/DragDropItemDropTarget';
import { DragDropItemSortableCell } from '@/app/native-extension-host/api/modules/ui/utilities/drag-and-drop/components/DragDropItemSortableCell';
import { DragDropItemSortableHandle } from '@/app/native-extension-host/api/modules/ui/utilities/drag-and-drop/components/DragDropItemSortableHandle';
import { DND_KIT_PROVIDER_PLUGINS_WITHOUT_DROP_ANIMATION } from '@/app/native-extension-host/api/modules/ui/utilities/drag-and-drop/constants/DndKitProviderPluginsWithoutDropAnimation';
import { DND_KIT_SENSORS } from '@/app/native-extension-host/api/modules/ui/utilities/drag-and-drop/constants/DndKitSensors';
import {
  DragDropItemDndContext,
  type DragDropItemDndContextValue,
} from '@/app/native-extension-host/api/modules/ui/utilities/drag-and-drop/context/DragDropItemDndContext';
import { type DragDropProviderDragEndEvent } from '@/app/native-extension-host/api/modules/ui/utilities/drag-and-drop/types/DragDropProviderDragEndEvent';
import { type DragDropProviderDragMoveEvent } from '@/app/native-extension-host/api/modules/ui/utilities/drag-and-drop/types/DragDropProviderDragMoveEvent';
import { getDestinationIndex } from '@/app/native-extension-host/api/modules/ui/utilities/drag-and-drop/utils/getDestinationIndex';
import { resolveDropFromPointer } from '@/app/native-extension-host/api/modules/ui/utilities/drag-and-drop/utils/resolveDropFromPointer';

const StyledList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.betweenSiblingsGap};
  padding-top: ${themeCssVariables.betweenSiblingsGap};
`;

const StyledSortActions = styled.div`
  display: flex;
  opacity: 0;
  pointer-events: none;
  transition: opacity 150ms ease;
`;

const StyledListItem = styled.div`
  align-items: center;
  display: flex;

  > :first-child {
    flex: 1;
    min-width: 0;
  }

  &:hover ${StyledSortActions},
  &:focus-within ${StyledSortActions} {
    opacity: 1;
    pointer-events: auto;
  }

  @media (hover: none) {
    ${StyledSortActions} {
      opacity: 1;
      pointer-events: auto;
    }
  }
`;

const RECORD_LISTS_DROPPABLE_ID = 'record-lists';
const RECORD_LIST_DND_TYPE = 'record-list';

type RecordListDndData = {
  type: typeof RECORD_LIST_DND_TYPE;
  index: number;
};

export const RecordListsSection = () => {
  const { t } = useLingui();
  const { recordLists } = useRecordLists();
  const { openModal } = useModal();
  const { getIcon } = useIcons();
  const location = useLocation();
  const [activeDropTargetIndex, setActiveDropTargetIndex] = useState<
    number | null
  >(null);
  const { reorderRecordLists, loading: isReordering } =
    useReorderRecordLists();
  const { enqueueErrorSnackBar } = useSnackBar();
  const { toggleNavigationSection, isNavigationSectionOpen } =
    useNavigationSection('Lists');

  const persistOrder = async (sourceIndex: number, destinationIndex: number) => {
    if (sourceIndex === destinationIndex || isReordering) {
      return;
    }

    const reorderedLists = [...recordLists];
    const [movedList] = reorderedLists.splice(sourceIndex, 1);

    reorderedLists.splice(destinationIndex, 0, movedList);

    try {
      await reorderRecordLists(reorderedLists.map((recordList) => recordList.id));
    } catch {
      enqueueErrorSnackBar({ message: t`Failed to reorder list` });
    }
  };

  const resolveDrop = (
    event:
      | DragDropProviderDragMoveEvent<RecordListDndData>
      | DragDropProviderDragEndEvent<RecordListDndData>,
  ) =>
    resolveDropFromPointer({
      target: event.operation.target,
      pointer: event.operation.position.current,
      defaultOrientation: 'horizontal',
      getDroppableItemCount: () => recordLists.length,
    });

  const handleDragEnd = (
    event: DragDropProviderDragEndEvent<RecordListDndData>,
  ) => {
    setActiveDropTargetIndex(null);
    const sourceData = event.operation.source?.data as
      | RecordListDndData
      | undefined;
    const resolvedDrop = resolveDrop(event);

    if (
      event.canceled ||
      sourceData?.type !== RECORD_LIST_DND_TYPE ||
      !isDefined(resolvedDrop)
    ) {
      return;
    }

    const destinationIndex = getDestinationIndex({
      dropTargetIndex: resolvedDrop.dropTargetIndex,
      sourceIndex: sourceData.index,
      sourceDroppableId: RECORD_LISTS_DROPPABLE_ID,
      destinationDroppableId: RECORD_LISTS_DROPPABLE_ID,
    });

    void persistOrder(sourceData.index, destinationIndex);
  };

  const dragDropContextValue: DragDropItemDndContextValue = {
    activeDropTargetIndex,
    activeDroppableId: RECORD_LISTS_DROPPABLE_ID,
  };

  return (
    <>
      <NavigationMenuItemSection
        title={t`Lists`}
        isOpen={isNavigationSectionOpen}
        onToggle={toggleNavigationSection}
        alwaysShowRightIcon
        rightIcon={
          <LightIconButton
            aria-label={t`Create list`}
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              openModal(CREATE_RECORD_LIST_MODAL_ID);
            }}
          >
            <IconPlus />
          </LightIconButton>
        }
      >
        <DragDropItemDndContext.Provider value={dragDropContextValue}>
          <DragDropProvider<RecordListDndData>
            sensors={DND_KIT_SENSORS}
            plugins={DND_KIT_PROVIDER_PLUGINS_WITHOUT_DROP_ANIMATION}
            onDragMove={(event) =>
              setActiveDropTargetIndex(
                resolveDrop(event)?.dropTargetIndex ?? null,
              )
            }
            onDragEnd={handleDragEnd}
          >
            <StyledList>
              {recordLists.map((recordList, index) => (
                <Fragment key={recordList.id}>
                  <DragDropItemDropTarget
                    index={index}
                    droppableId={RECORD_LISTS_DROPPABLE_ID}
                    orientation="horizontal"
                    compact
                  />
                  <DragDropItemSortableCell
                    id={recordList.id}
                    index={index}
                    group={RECORD_LISTS_DROPPABLE_ID}
                    type={RECORD_LIST_DND_TYPE}
                    accept={RECORD_LIST_DND_TYPE}
                    data={{ type: RECORD_LIST_DND_TYPE, index }}
                    disabled={isReordering}
                    restrictMovementTo="y"
                    orientation="horizontal"
                  >
                    <SortableRecordListItem
                      recordList={recordList}
                      canMoveUp={index > 0}
                      canMoveDown={index < recordLists.length - 1}
                      isReordering={isReordering}
                      onMoveUp={() => void persistOrder(index, index - 1)}
                      onMoveDown={() => void persistOrder(index, index + 1)}
                      activePath={location.pathname}
                      getIcon={getIcon}
                    />
                  </DragDropItemSortableCell>
                </Fragment>
              ))}
              <DragDropItemDropTarget
                index={recordLists.length}
                droppableId={RECORD_LISTS_DROPPABLE_ID}
                orientation="horizontal"
                compact
              />
            </StyledList>
          </DragDropProvider>
        </DragDropItemDndContext.Provider>
      </NavigationMenuItemSection>
      <CreateRecordListModal />
    </>
  );
};

const SortableRecordListItem = ({
  recordList,
  canMoveUp,
  canMoveDown,
  isReordering,
  onMoveUp,
  onMoveDown,
  activePath,
  getIcon,
}: {
  recordList: RecordList;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isReordering: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  activePath: string;
  getIcon: ReturnType<typeof useIcons>['getIcon'];
}) => {
  const path = getRecordListPath(recordList.id);
  const ListIcon = isDefined(recordList.icon)
    ? getIcon(recordList.icon)
    : IconList;

  return (
    <StyledListItem>
      <NavigationDrawerItem
        label={recordList.name}
        Icon={ListIcon}
        to={path}
        active={activePath === path}
      />
      <StyledSortActions>
        <DragDropItemSortableHandle disabled={isReordering}>
          <LightIconButton
            aria-label={t`Drag to reorder list`}
            size="sm"
            disabled={isReordering}
          >
            <IconGripVertical />
          </LightIconButton>
        </DragDropItemSortableHandle>
        {canMoveUp && (
          <LightIconButton
            aria-label={t`Move list up`}
            size="sm"
            disabled={isReordering}
            onClick={onMoveUp}
          >
            <IconChevronUp />
          </LightIconButton>
        )}
        {canMoveDown && (
          <LightIconButton
            aria-label={t`Move list down`}
            size="sm"
            disabled={isReordering}
            onClick={onMoveDown}
          >
            <IconChevronDown />
          </LightIconButton>
        )}
      </StyledSortActions>
    </StyledListItem>
  );
};
