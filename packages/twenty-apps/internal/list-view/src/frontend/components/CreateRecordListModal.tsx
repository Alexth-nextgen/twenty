import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import camelCase from 'lodash.camelcase';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FieldMetadataType } from 'twenty-shared/types';
import { isDefined, isPlainObject } from 'twenty-shared/utils';
import { Button } from 'twenty-ui/primitives/input';
import { LightIconButton } from 'twenty-ui/components';
import {
  IconArrowLeft,
  IconList,
  IconSparkles,
  IconStar,
  IconX,
  useIcons,
} from 'twenty-ui/icon';
import { Dialog } from 'twenty-ui/primitives/surfaces';
import { themeCssVariables } from 'twenty-ui/theme';

import { useFilteredObjectMetadataItems } from '@/app/native-extension-host/api/modules/object-metadata/hooks/useFilteredObjectMetadataItems';
import { CREATE_RECORD_LIST_MODAL_ID } from '../constants/CreateRecordListModalId';
import { useInvalidateMetadataStore } from '@/app/native-extension-host/api/modules/metadata-store/hooks/useInvalidateMetadataStore';
import {
  getRecordListTemplates,
  type RecordListTemplateField,
  type RecordListTemplate,
  type RecordListTemplateKey,
} from '../constants/recordListTemplates';
import { getDefaultEditableRecordListFields } from '../constants/editableRecordListTemplateFields';
import {
  CUSTOM_RECORD_LIST_TEMPLATES_UPDATED_EVENT,
  getSavedCustomRecordListTemplates,
} from '../utils/customRecordListTemplates';
import { useCreateRecordList } from '../hooks/useCreateRecordList';
import { useRecordLists } from '../hooks/useRecordLists';
import { getRecordListPath } from '../utils/getRecordListPath';
import { getRecordListSelectOptionValue } from '../utils/getRecordListSelectOptionValue';
import { useSnackBar } from '@/app/native-extension-host/api/modules/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { IconPicker } from '@/app/native-extension-host/api/modules/ui/input/components/IconPicker';
import { ModalStatefulWrapper } from '@/app/native-extension-host/api/modules/ui/layout/modal/components/ModalStatefulWrapper';
import { useModal } from '@/app/native-extension-host/api/modules/ui/layout/modal/hooks/useModal';

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const getMetadataValidationErrorMessage = (error: unknown) => {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const errorRecord = error as Record<string, unknown>;
  const graphQLErrors = Array.isArray(errorRecord.errors)
    ? errorRecord.errors
    : Array.isArray(errorRecord.graphQLErrors)
      ? errorRecord.graphQLErrors
      : [];
  const validationMessages = graphQLErrors.flatMap((graphQLError) => {
    if (typeof graphQLError !== 'object' || graphQLError === null) {
      return [];
    }

    const graphQLErrorRecord = graphQLError as Record<string, unknown>;

    if (
      !isPlainObject(graphQLErrorRecord.extensions) ||
      !isPlainObject(graphQLErrorRecord.extensions.errors)
    ) {
      return [];
    }

    return Object.values(graphQLErrorRecord.extensions.errors).flatMap(
      (metadataErrors) => {
        if (!Array.isArray(metadataErrors)) {
          return [];
        }

        return metadataErrors.flatMap((metadataError) => {
          if (
            !isPlainObject(metadataError) ||
            !Array.isArray(metadataError.errors)
          ) {
            return [];
          }

          return metadataError.errors.flatMap((validationError) => {
            if (!isPlainObject(validationError)) {
              return [];
            }

            const message =
              validationError.userFriendlyMessage ?? validationError.message;

            return typeof message === 'string' && message.length > 0
              ? [message]
              : [];
          });
        });
      },
    );
  });

  return validationMessages.length > 0
    ? [...new Set(validationMessages)].join('; ')
    : undefined;
};

const StyledContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[5]};
  max-height: min(520px, calc(100vh - 300px));
  overflow-y: auto;
  padding-right: ${themeCssVariables.spacing[1]};
`;

const StyledTemplateIntro = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledTemplateTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledTemplateDescription = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledTemplateBrowser = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: 180px minmax(0, 1fr);

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const StyledTemplateCategories = styled.div`
  border-right: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  max-height: 520px;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]}
    ${themeCssVariables.spacing[2]} 0;
`;

const StyledCategoryButton = styled.button<{ selected: boolean }>`
  background: ${({ selected }) =>
    selected ? themeCssVariables.background.transparent.blue : 'transparent'};
  border: 0;
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font-family: ${themeCssVariables.font.family};
  min-height: 36px;
  padding: 0 ${themeCssVariables.spacing[2]};
  text-align: left;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledTemplateResults = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  min-width: 0;
  max-height: 520px;
  overflow-y: auto;
  padding-left: ${themeCssVariables.spacing[4]};
`;

const StyledTemplateSearch = styled.input`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.md};
  min-height: 40px;
  padding: 0 ${themeCssVariables.spacing[3]};
  width: 100%;

  &:focus {
    border-color: ${themeCssVariables.color.blue};
    outline: none;
  }
`;

const StyledTemplateCategoryTitle = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  text-transform: uppercase;
`;

const StyledNoTemplates = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[5]} ${themeCssVariables.spacing[3]};
`;

const StyledTemplateGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: minmax(0, 1fr);

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const StyledTemplateButton = styled.div<{ selected: boolean }>`
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
  display: flex;
  flex-direction: row;
  font-family: ${themeCssVariables.font.family};
  gap: ${themeCssVariables.spacing[4]};
  min-height: 150px;
  padding: ${themeCssVariables.spacing[4]};
  transition:
    background 150ms ease,
    border-color 150ms ease;

  &:hover {
    border-color: ${themeCssVariables.border.color.strong};
  }

  &:focus-within {
    outline: 2px solid ${themeCssVariables.color.blue};
    outline-offset: 2px;
  }
`;

const StyledTemplateSelectButton = styled.button`
  align-items: stretch;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  display: flex;
  flex: 1;
  font-family: inherit;
  gap: ${themeCssVariables.spacing[4]};
  min-width: 0;
  padding: 0;
  text-align: left;
`;

const StyledTemplateHeader = styled.div`
  align-items: center;
  display: flex;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledTemplatePreview = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex: 0 0 180px;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: center;
  overflow: hidden;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledPreviewHeading = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  gap: ${themeCssVariables.spacing[2]};
  padding-bottom: ${themeCssVariables.spacing[1]};
`;

const StyledPreviewRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledPreviewDot = styled.span`
  background: ${themeCssVariables.color.blue};
  border-radius: 50%;
  height: 8px;
  width: 8px;
`;

const StyledPreviewLine = styled.span<{ width: string }>`
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.sm};
  height: 7px;
  width: ${({ width }) => width};
`;

const StyledTemplateCardContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
`;

const StyledTemplateCardTop = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const StyledFavoriteButton = styled.button<{ favorite: boolean }>`
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ favorite }) =>
    favorite
      ? themeCssVariables.color.yellow
      : themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 auto;
  height: 28px;
  justify-content: center;
  width: 28px;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }

  &[aria-pressed='true'] svg {
    fill: ${themeCssVariables.color.yellow};
  }
`;

const StyledTemplateCardDescription = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.4;
`;

const StyledFieldList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledFieldPill = styled.span`
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;

const FAVORITE_TEMPLATES_STORAGE_KEY = 'twenty-list-view-favorite-templates';

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

const StyledNameRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledFieldsEditor = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledEditableField = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: minmax(0, 1fr) 120px 28px;
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledFieldInput = styled(StyledInput)`
  font-size: ${themeCssVariables.font.size.sm};
  min-height: 34px;
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledSelect = styled.select`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.sm};
  min-height: 34px;
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledOptionsInput = styled(StyledFieldInput)`
  grid-column: 1 / -1;
`;

const StyledAddField = styled.div`
  align-items: center;
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: minmax(0, 1fr) 120px auto;
`;

const getTemplateFieldName = (label: string, fallback: string) => {
  const normalizedName = camelCase(label);

  if (/^[a-z]/.test(normalizedName)) {
    return normalizedName;
  }

  return normalizedName.length > 0 ? `field${normalizedName}` : fallback;
};

export const CreateRecordListModal = () => {
  const builtInTemplates = getRecordListTemplates();
  const [customTemplates, setCustomTemplates] = useState(
    getSavedCustomRecordListTemplates,
  );
  const templates = [...customTemplates, ...builtInTemplates];

  useEffect(() => {
    const handleCustomTemplatesUpdated = () => {
      setCustomTemplates(getSavedCustomRecordListTemplates());
    };

    window.addEventListener(
      CUSTOM_RECORD_LIST_TEMPLATES_UPDATED_EVENT,
      handleCustomTemplatesUpdated,
    );

    return () => {
      window.removeEventListener(
        CUSTOM_RECORD_LIST_TEMPLATES_UPDATED_EVENT,
        handleCustomTemplatesUpdated,
      );
    };
  }, []);
  const [step, setStep] = useState<'templates' | 'details'>('templates');
  const [isScratchCreation, setIsScratchCreation] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<RecordListTemplate>(
    templates[0],
  );
  const [templateKeyForCreation, setTemplateKeyForCreation] =
    useState<RecordListTemplateKey | null>(null);
  const [templateFieldsForCreation, setTemplateFieldsForCreation] = useState<
    RecordListTemplateField[] | null
  >(null);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<string>(
    FieldMetadataType.TEXT,
  );
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoriteTemplateKeys, setFavoriteTemplateKeys] = useState<string[]>(
    () => {
      try {
        const storedFavorites = window.localStorage.getItem(
          FAVORITE_TEMPLATES_STORAGE_KEY,
        );
        const parsedFavorites: unknown = isDefined(storedFavorites)
          ? JSON.parse(storedFavorites)
          : [];

        return Array.isArray(parsedFavorites)
          ? (parsedFavorites as unknown[]).filter(
              (key): key is string =>
                typeof key === 'string' &&
                templates.some((template) => template.key === key),
            )
          : [];
      } catch {
        return [];
      }
    },
  );
  const [name, setName] = useState('');
  const [parentObjectMetadataId, setParentObjectMetadataId] = useState('');
  const [icon, setIcon] = useState('IconList');
  const { activeObjectMetadataItems } = useFilteredObjectMetadataItems();
  const { recordLists } = useRecordLists();
  const { createRecordList, loading } = useCreateRecordList();
  const { invalidateMetadataStore } = useInvalidateMetadataStore();
  const { closeModal } = useModal();
  const { enqueueErrorSnackBar } = useSnackBar();
  const { getIcon } = useIcons();
  const navigate = useNavigate();

  const templateCategories = Array.from(
    new Set(templates.flatMap((template) => template.categories)),
  ).sort((firstCategory, secondCategory) =>
    firstCategory.localeCompare(secondCategory),
  );
  const normalizedTemplateSearch = templateSearch.trim().toLocaleLowerCase();
  const filteredTemplates = templates.filter((template) => {
    const matchesCategory =
      selectedCategory === null ||
      template.categories.includes(selectedCategory);
    const searchableText = [
      template.title,
      template.description,
      ...template.categories,
      ...template.fieldLabels,
    ]
      .join(' ')
      .toLocaleLowerCase();

    return (
      matchesCategory &&
      (!showFavorites || favoriteTemplateKeys.includes(template.key)) &&
      (normalizedTemplateSearch.length === 0 ||
        searchableText.includes(normalizedTemplateSearch))
    );
  });

  const internalEntryObjectIds = new Set(
    recordLists.map((recordList) => recordList.entryObjectMetadataId),
  );
  const availableObjectMetadataItems = activeObjectMetadataItems.filter(
    (objectMetadataItem) =>
      !internalEntryObjectIds.has(objectMetadataItem.id) &&
      ['person', 'company'].includes(objectMetadataItem.nameSingular),
  );

  const handleClose = () => {
    setStep('templates');
    setIsScratchCreation(false);
    setSelectedTemplate(templates[0]);
    setTemplateKeyForCreation(null);
    setTemplateFieldsForCreation(null);
    setNewFieldLabel('');
    setNewFieldType(FieldMetadataType.TEXT);
    setTemplateSearch('');
    setSelectedCategory(null);
    setShowFavorites(false);
    setName('');
    setParentObjectMetadataId('');
    setIcon('IconList');
    closeModal(CREATE_RECORD_LIST_MODAL_ID);
  };

  const handleToggleFavorite = (templateKey: string) => {
    const nextFavoriteKeys = favoriteTemplateKeys.includes(templateKey)
      ? favoriteTemplateKeys.filter(
          (favoriteKey) => favoriteKey !== templateKey,
        )
      : [...favoriteTemplateKeys, templateKey];

    setFavoriteTemplateKeys(nextFavoriteKeys);
    try {
      window.localStorage.setItem(
        FAVORITE_TEMPLATES_STORAGE_KEY,
        JSON.stringify(nextFavoriteKeys),
      );
    } catch {
      // Favorite state remains available for the current modal session.
    }
  };

  const handleContinueWithTemplate = (template: RecordListTemplate | null) => {
    const suggestedObjectMetadataItem = isDefined(template)
      ? availableObjectMetadataItems.find(
          (objectMetadataItem) =>
            objectMetadataItem.nameSingular ===
            template.suggestedObjectNameSingular,
        )
      : undefined;

    setName(template?.title ?? '');
    setIcon(template?.icon ?? 'IconList');
    setParentObjectMetadataId(suggestedObjectMetadataItem?.id ?? '');
    setSelectedTemplate(template ?? templates[0]);
    setTemplateKeyForCreation(template?.templateKey ?? null);
    setIsScratchCreation(template === null);
    setTemplateFieldsForCreation(
      (template?.templateFields ?? getDefaultEditableRecordListFields()).map(
        (field) => ({
          ...field,
          options: field.options?.map((option) => ({ ...option })),
        }),
      ),
    );
    setNewFieldLabel('');
    setNewFieldType(FieldMetadataType.TEXT);
    setStep('details');
  };

  const handleUpdateTemplateField = (
    fieldIndex: number,
    updates: Partial<RecordListTemplateField>,
  ) => {
    setTemplateFieldsForCreation((currentFields) =>
      (currentFields ?? []).map((field, index) =>
        index === fieldIndex ? { ...field, ...updates } : field,
      ),
    );
  };

  const handleUpdateTemplateFieldLabel = (
    fieldIndex: number,
    label: string,
  ) => {
    const existingNames = (templateFieldsForCreation ?? [])
      .filter((_, index) => index !== fieldIndex)
      .map((field) => field.name);
    const baseName = getTemplateFieldName(label, `field${fieldIndex + 1}`);
    let name = baseName;
    let suffix = 2;

    while (existingNames.includes(name)) {
      name = `${baseName}${suffix}`;
      suffix += 1;
    }

    handleUpdateTemplateField(fieldIndex, { label, name });
  };

  const handleAddTemplateField = () => {
    const label = newFieldLabel.trim();

    if (label.length === 0) {
      return;
    }

    const existingNames = (templateFieldsForCreation ?? []).map(
      (field) => field.name,
    );
    const baseName = getTemplateFieldName(label, 'field');
    let name = baseName;
    let suffix = 2;

    while (existingNames.includes(name)) {
      name = `${baseName}${suffix}`;
      suffix += 1;
    }

    const optionValues: string[] = [];
    const fieldOptions =
      newFieldType === FieldMetadataType.SELECT
        ? ['Option 1', 'Option 2'].map((optionLabel, index) => {
            const value = getRecordListSelectOptionValue(
              optionLabel,
              optionValues,
            );

            optionValues.push(value);

            return {
              label: optionLabel,
              value,
              color: ['blue', 'purple'][index],
            };
          })
        : undefined;

    setTemplateFieldsForCreation((currentFields) => [
      ...(currentFields ?? []),
      {
        name,
        label,
        type: newFieldType,
        icon:
          newFieldType === FieldMetadataType.DATE
            ? 'IconCalendarEvent'
            : newFieldType === FieldMetadataType.SELECT
              ? 'IconList'
              : 'IconTextSize',
        ...(isDefined(fieldOptions) ? { options: fieldOptions } : {}),
      },
    ]);
    setNewFieldLabel('');
    setNewFieldType(FieldMetadataType.TEXT);
  };

  const handleCreate = async () => {
    if (
      name.trim().length === 0 ||
      parentObjectMetadataId.length === 0 ||
      (templateFieldsForCreation ?? []).some(
        (field) =>
          field.label.trim().length === 0 ||
          (field.type === FieldMetadataType.SELECT &&
            (field.options?.length ?? 0) === 0),
      )
    ) {
      return;
    }

    try {
      const recordList = await createRecordList({
        name: name.trim(),
        icon,
        parentObjectMetadataId,
        templateKey: templateKeyForCreation,
        templateFields: templateFieldsForCreation,
      });

      if (isDefined(recordList)) {
        invalidateMetadataStore();
        handleClose();
        navigate(getRecordListPath(recordList.id));
      }
    } catch (error) {
      console.error('Failed to create list', error);
      enqueueErrorSnackBar({
        message:
          getMetadataValidationErrorMessage(error) ??
          (error instanceof Error ? error.message : t`Failed to create list`),
      });
    }
  };

  return (
    <ModalStatefulWrapper
      modalInstanceId={CREATE_RECORD_LIST_MODAL_ID}
      isClosable
      onClose={handleClose}
      size="large"
      renderInDocumentBody
      autoHeight
    >
      <Dialog.Header>
        <StyledHeader>
          <span>
            {step === 'templates' ? t`List templates` : t`Create list`}
          </span>
          <LightIconButton
            aria-label={t`Close`}
            size="sm"
            onClick={handleClose}
          >
            <IconX />
          </LightIconButton>
        </StyledHeader>
      </Dialog.Header>
      <Dialog.Body>
        <StyledContent>
          {step === 'templates' ? (
            <>
              <StyledTemplateIntro>
                <StyledTemplateTitle>{t`Start with a proven workflow`}</StyledTemplateTitle>
                <StyledTemplateDescription>
                  {t`Templates create list-specific fields, status options, and a ready-to-use pipeline view. You can change everything later.`}
                </StyledTemplateDescription>
              </StyledTemplateIntro>
              <StyledTemplateBrowser>
                <StyledTemplateCategories aria-label={t`Use cases`}>
                  <StyledTemplateCategoryTitle>{t`Use cases`}</StyledTemplateCategoryTitle>
                  <StyledCategoryButton
                    type="button"
                    selected={showFavorites}
                    aria-pressed={showFavorites}
                    onClick={() => {
                      setShowFavorites(true);
                      setSelectedCategory(null);
                    }}
                  >
                    <IconStar size={16} /> {t`Favorites`}
                    {favoriteTemplateKeys.length > 0 &&
                      ` (${favoriteTemplateKeys.length})`}
                  </StyledCategoryButton>
                  <StyledCategoryButton
                    type="button"
                    selected={!showFavorites && selectedCategory === null}
                    aria-pressed={!showFavorites && selectedCategory === null}
                    onClick={() => {
                      setShowFavorites(false);
                      setSelectedCategory(null);
                    }}
                  >
                    {t`All templates`}
                  </StyledCategoryButton>
                  {templateCategories.map((category) => (
                    <StyledCategoryButton
                      key={category}
                      type="button"
                      selected={!showFavorites && selectedCategory === category}
                      aria-pressed={
                        !showFavorites && selectedCategory === category
                      }
                      onClick={() => {
                        setShowFavorites(false);
                        setSelectedCategory(category);
                      }}
                    >
                      {category}
                    </StyledCategoryButton>
                  ))}
                </StyledTemplateCategories>
                <StyledTemplateResults>
                  <StyledTemplateSearch
                    aria-label={t`Search templates`}
                    placeholder={t`Search templates, topics, goals…`}
                    value={templateSearch}
                    onChange={(event) => setTemplateSearch(event.target.value)}
                  />
                  {filteredTemplates.length > 0 ? (
                    <StyledTemplateGrid>
                      {filteredTemplates.map((template) => {
                        const TemplateIcon = getIcon(template.icon);
                        const isFavorite = favoriteTemplateKeys.includes(
                          template.key,
                        );

                        return (
                          <StyledTemplateButton
                            key={template.key}
                            selected={selectedTemplate.key === template.key}
                          >
                            <StyledTemplateSelectButton
                              type="button"
                              aria-pressed={
                                selectedTemplate.key === template.key
                              }
                              onClick={() => setSelectedTemplate(template)}
                              onDoubleClick={() =>
                                handleContinueWithTemplate(template)
                              }
                            >
                              <StyledTemplatePreview aria-hidden="true">
                                <StyledPreviewHeading>
                                  <TemplateIcon size={14} />
                                  {template.title}
                                </StyledPreviewHeading>
                                {template.fieldLabels
                                  .slice(0, 3)
                                  .map((fieldLabel, index) => (
                                    <StyledPreviewRow key={fieldLabel}>
                                      <StyledPreviewDot />
                                      <StyledPreviewLine
                                        width={
                                          index === 0
                                            ? '72%'
                                            : index === 1
                                              ? '54%'
                                              : '64%'
                                        }
                                      />
                                    </StyledPreviewRow>
                                  ))}
                              </StyledTemplatePreview>
                              <StyledTemplateCardContent>
                                <StyledTemplateCardTop>
                                  <StyledTemplateHeader>
                                    <TemplateIcon size={20} />
                                    {template.title}
                                  </StyledTemplateHeader>
                                </StyledTemplateCardTop>
                                <StyledTemplateCardDescription>
                                  {template.description}
                                </StyledTemplateCardDescription>
                                <StyledFieldList>
                                  {template.fieldLabels
                                    .slice(0, 5)
                                    .map((fieldLabel) => (
                                      <StyledFieldPill key={fieldLabel}>
                                        {fieldLabel}
                                      </StyledFieldPill>
                                    ))}
                                  {template.fieldLabels.length > 5 && (
                                    <StyledFieldPill>
                                      +{template.fieldLabels.length - 5}
                                    </StyledFieldPill>
                                  )}
                                </StyledFieldList>
                                <StyledFieldList>
                                  <StyledFieldPill>
                                    {template.suggestedObjectNameSingular ===
                                    'person'
                                      ? t`People`
                                      : t`Companies`}
                                  </StyledFieldPill>
                                  {template.categories.map((category) => (
                                    <StyledFieldPill key={category}>
                                      {category}
                                    </StyledFieldPill>
                                  ))}
                                </StyledFieldList>
                              </StyledTemplateCardContent>
                            </StyledTemplateSelectButton>
                            <StyledFavoriteButton
                              type="button"
                              favorite={isFavorite}
                              aria-label={
                                isFavorite
                                  ? t`Remove ${template.title} from favorites`
                                  : t`Add ${template.title} to favorites`
                              }
                              aria-pressed={isFavorite}
                              onClick={() => handleToggleFavorite(template.key)}
                            >
                              <IconStar size={18} />
                            </StyledFavoriteButton>
                          </StyledTemplateButton>
                        );
                      })}
                    </StyledTemplateGrid>
                  ) : (
                    <StyledNoTemplates>{t`No templates found`}</StyledNoTemplates>
                  )}
                </StyledTemplateResults>
              </StyledTemplateBrowser>
            </>
          ) : (
            <>
              {!isScratchCreation && (
                <StyledTemplateIntro>
                  <StyledTemplateTitle>
                    {selectedTemplate.title}
                  </StyledTemplateTitle>
                  <StyledTemplateDescription>
                    {selectedTemplate.description}
                  </StyledTemplateDescription>
                </StyledTemplateIntro>
              )}
              <StyledLabel>
                {t`List fields`}
                <StyledFieldsEditor>
                  {(templateFieldsForCreation ?? []).map((field, index) => (
                    <StyledEditableField key={`${field.name}-${index}`}>
                      <StyledFieldInput
                        aria-label={t`Field name`}
                        maxLength={100}
                        value={field.label}
                        onChange={(event) =>
                          handleUpdateTemplateFieldLabel(
                            index,
                            event.target.value,
                          )
                        }
                      />
                      <StyledSelect
                        aria-label={t`Field type`}
                        value={field.type}
                        onChange={(event) => {
                          const type = event.target.value;
                          const options =
                            type === FieldMetadataType.SELECT
                              ? field.options?.length
                                ? field.options
                                : [
                                    {
                                      label: 'Option 1',
                                      value: 'OPTION_1',
                                      color: 'blue',
                                    },
                                    {
                                      label: 'Option 2',
                                      value: 'OPTION_2',
                                      color: 'purple',
                                    },
                                  ]
                              : undefined;

                          handleUpdateTemplateField(index, { type, options });
                        }}
                      >
                        <option
                          value={FieldMetadataType.TEXT}
                        >{t`Text`}</option>
                        <option value={FieldMetadataType.NUMBER}>
                          {t`Number`}
                        </option>
                        <option
                          value={FieldMetadataType.DATE}
                        >{t`Date`}</option>
                        <option value={FieldMetadataType.BOOLEAN}>
                          {t`Checkbox`}
                        </option>
                        <option value={FieldMetadataType.SELECT}>
                          {t`Select`}
                        </option>
                      </StyledSelect>
                      <LightIconButton
                        aria-label={t`Remove ${field.label}`}
                        size="sm"
                        onClick={() =>
                          setTemplateFieldsForCreation((currentFields) =>
                            (currentFields ?? []).filter(
                              (_, fieldIndex) => fieldIndex !== index,
                            ),
                          )
                        }
                      >
                        <IconX />
                      </LightIconButton>
                      {field.type === FieldMetadataType.SELECT && (
                        <StyledOptionsInput
                          aria-label={t`Options for ${field.label}`}
                          value={(field.options ?? [])
                            .map((option) => option.label)
                            .join(', ')}
                          placeholder={t`Separate options with commas`}
                          onChange={(event) => {
                            const colorPalette = [
                              'gray',
                              'blue',
                              'purple',
                              'orange',
                              'green',
                              'red',
                            ];
                            const optionValues: string[] = [];
                            const options = event.target.value
                              .split(',')
                              .map((optionLabel) => optionLabel.trim())
                              .filter((optionLabel) => optionLabel.length > 0)
                              .slice(0, 30)
                              .map((optionLabel, optionIndex) => {
                                const value = getRecordListSelectOptionValue(
                                  optionLabel,
                                  optionValues,
                                );

                                optionValues.push(value);

                                return {
                                  label: optionLabel,
                                  value,
                                  color:
                                    colorPalette[
                                      optionIndex % colorPalette.length
                                    ],
                                };
                              });

                            handleUpdateTemplateField(index, { options });
                          }}
                        />
                      )}
                    </StyledEditableField>
                  ))}
                  <StyledAddField>
                    <StyledFieldInput
                      aria-label={t`New field name`}
                      placeholder={t`Add a field`}
                      maxLength={100}
                      value={newFieldLabel}
                      onChange={(event) => setNewFieldLabel(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleAddTemplateField();
                        }
                      }}
                    />
                    <StyledSelect
                      aria-label={t`New field type`}
                      value={newFieldType}
                      onChange={(event) => setNewFieldType(event.target.value)}
                    >
                      <option value={FieldMetadataType.TEXT}>{t`Text`}</option>
                      <option value={FieldMetadataType.NUMBER}>
                        {t`Number`}
                      </option>
                      <option value={FieldMetadataType.DATE}>{t`Date`}</option>
                      <option value={FieldMetadataType.BOOLEAN}>
                        {t`Checkbox`}
                      </option>
                      <option value={FieldMetadataType.SELECT}>
                        {t`Select`}
                      </option>
                    </StyledSelect>
                    <Button
                      variant="outline"
                      disabled={
                        newFieldLabel.trim().length === 0 ||
                        (templateFieldsForCreation?.length ?? 0) >= 30
                      }
                      onClick={handleAddTemplateField}
                    >
                      {t`Add field`}
                    </Button>
                  </StyledAddField>
                </StyledFieldsEditor>
              </StyledLabel>
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
                        selected={
                          parentObjectMetadataId === objectMetadataItem.id
                        }
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
                <StyledNameRow>
                  <IconPicker
                    dropdownId="create-record-list-icon-picker"
                    selectedIconKey={icon}
                    onChange={({ iconKey }) => setIcon(iconKey)}
                  />
                  <StyledInput
                    autoFocus
                    value={name}
                    placeholder={t`New list`}
                    onChange={(event) => setName(event.target.value)}
                  />
                </StyledNameRow>
              </StyledLabel>
            </>
          )}
        </StyledContent>
      </Dialog.Body>
      <Dialog.Footer>
        <StyledFooterActions>
          {step === 'templates' ? (
            <>
              <Button
                startIcon={<IconList />}
                variant="outline"
                onClick={() => handleContinueWithTemplate(null)}
              >
                {t`Start from scratch`}
              </Button>
              <Button
                color="accent"
                variant="solid"
                startIcon={<IconSparkles />}
                onClick={() => handleContinueWithTemplate(selectedTemplate)}
              >
                {t`Preview template`}
              </Button>
            </>
          ) : (
            <>
              <Button
                startIcon={<IconArrowLeft />}
                variant="outline"
                onClick={() => setStep('templates')}
              >
                {t`Back`}
              </Button>
              <Button
                color="accent"
                variant="solid"
                disabled={
                  name.trim().length === 0 ||
                  parentObjectMetadataId.length === 0 ||
                  (templateFieldsForCreation ?? []).some(
                    (field) =>
                      field.label.trim().length === 0 ||
                      (field.type === FieldMetadataType.SELECT &&
                        (field.options?.length ?? 0) === 0),
                  )
                }
                loading={loading}
                onClick={() => void handleCreate()}
              >
                {t`Create list`}
              </Button>
            </>
          )}
        </StyledFooterActions>
      </Dialog.Footer>
    </ModalStatefulWrapper>
  );
};
