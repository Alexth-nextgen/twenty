import {
  type CSSProperties,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { RestApiClient } from 'twenty-client-sdk/rest';
import {
  closeSidePanel,
  enqueueSnackbar,
  unmountFrontComponent,
  useSelectedRecordIds,
} from 'twenty-sdk/front-component';

import {
  RECORD_LIST_TARGET_COMPANIES,
  RECORD_LIST_TARGET_PEOPLE,
} from 'src/constants/universal-identifiers';

type RecordListTarget =
  | typeof RECORD_LIST_TARGET_PEOPLE
  | typeof RECORD_LIST_TARGET_COMPANIES;

type AddRecordsToListProps = {
  target: RecordListTarget;
};

type RecordList = {
  id: string;
  name: string;
};

type AddRecordsResponse = {
  addedCount: number;
  skippedCount: number;
};

const styles: Record<string, CSSProperties> = {
  container: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'var(--t-font-family)',
    height: '100%',
  },
  header: {
    borderBottom: '1px solid var(--t-border-color-light)',
    padding: '16px',
  },
  title: {
    color: 'var(--t-font-color-primary)',
    fontSize: '16px',
    margin: 0,
  },
  subtitle: {
    color: 'var(--t-font-color-tertiary)',
    fontSize: '13px',
    margin: '6px 0 0',
  },
  body: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: '8px',
    padding: '16px',
  },
  label: {
    color: 'var(--t-font-color-secondary)',
    fontSize: '12px',
    fontWeight: 500,
  },
  select: {
    background: 'var(--t-background-secondary)',
    border: '1px solid var(--t-border-color-medium)',
    borderRadius: '6px',
    color: 'var(--t-font-color-primary)',
    fontFamily: 'var(--t-font-family)',
    fontSize: '13px',
    minHeight: '36px',
    padding: '0 10px',
    width: '100%',
  },
  empty: {
    color: 'var(--t-font-color-tertiary)',
    fontSize: '13px',
  },
  footer: {
    borderTop: '1px solid var(--t-border-color-light)',
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    padding: '12px 16px',
  },
  button: {
    border: 0,
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'var(--t-font-family)',
    fontSize: '13px',
    minHeight: '32px',
    padding: '0 12px',
  },
  secondaryButton: {
    background: 'var(--t-background-secondary)',
    color: 'var(--t-font-color-secondary)',
  },
  primaryButton: {
    background: 'var(--t-color-blue)',
    color: 'var(--t-font-color-inverted)',
  },
  disabledButton: {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
};

const readValue = (event: SyntheticEvent<HTMLSelectElement>) => {
  const valueEvent = event as {
    detail?: { value?: string };
    target?: { value?: string };
  };

  return valueEvent.detail?.value ?? valueEvent.target?.value ?? '';
};

export const AddRecordsToList = ({ target }: AddRecordsToListProps) => {
  const selectedRecordIds = useSelectedRecordIds();
  const [recordLists, setRecordLists] = useState<RecordList[]>([]);
  const [recordListId, setRecordListId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetLabel =
    target === RECORD_LIST_TARGET_PEOPLE ? 'people' : 'companies';

  const loadRecordLists = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await new CoreApiClient().query({
        recordLists: {
          __args: {
            filter: { target: { eq: target } },
            first: 100,
          },
          edges: {
            node: {
              id: true,
              name: true,
            },
          },
        },
      });
      const lists =
        result.recordLists?.edges?.map(
          ({ node }: { node: { id: string; name?: string | null } }) => ({
            id: node.id,
            name: node.name ?? 'Untitled list',
          }),
        ) ?? [];

      setRecordLists(lists);
      setRecordListId(lists[0]?.id ?? '');
    } catch {
      await enqueueSnackbar({
        message: 'Lists could not be loaded.',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [target]);

  useEffect(() => {
    void loadRecordLists();
  }, [loadRecordLists]);

  const close = () => {
    unmountFrontComponent();
    closeSidePanel();
  };

  const addRecords = async () => {
    if (recordListId === '' || selectedRecordIds.length === 0) return;

    setIsSubmitting(true);

    try {
      const { addedCount, skippedCount } =
        await new RestApiClient().post<AddRecordsResponse>(
          '/s/lists/add-records',
          {
            listId: recordListId,
            recordIds: selectedRecordIds,
            target,
          },
        );

      await enqueueSnackbar({
        message:
          skippedCount === 0
            ? `${addedCount} ${targetLabel} added to the list.`
            : `${addedCount} added; ${skippedCount} already present or not permitted.`,
        variant: skippedCount === 0 ? 'success' : 'warning',
      });

      close();
    } catch {
      await enqueueSnackbar({
        message: 'The selected records could not be added to the list.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled =
    isLoading ||
    isSubmitting ||
    recordListId === '' ||
    selectedRecordIds.length === 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Add to list</h2>
        <p style={styles.subtitle}>
          Add {selectedRecordIds.length} selected {targetLabel} to a list.
        </p>
      </div>

      <div style={styles.body}>
        <label htmlFor="record-list" style={styles.label}>
          List
        </label>
        {recordLists.length > 0 ? (
          <select
            id="record-list"
            value={recordListId}
            onChange={(event) => setRecordListId(readValue(event))}
            style={styles.select}
          >
            {recordLists.map((recordList) => (
              <option key={recordList.id} value={recordList.id}>
                {recordList.name}
              </option>
            ))}
          </select>
        ) : (
          <p style={styles.empty}>
            {isLoading
              ? 'Loading lists…'
              : `Create a ${targetLabel} list from the Lists page first.`}
          </p>
        )}
      </div>

      <div style={styles.footer}>
        <button
          type="button"
          onClick={close}
          style={{ ...styles.button, ...styles.secondaryButton }}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isSubmitDisabled}
          onClick={() => void addRecords()}
          style={{
            ...styles.button,
            ...styles.primaryButton,
            ...(isSubmitDisabled ? styles.disabledButton : {}),
          }}
        >
          {isSubmitting ? 'Adding…' : 'Add to list'}
        </button>
      </div>
    </div>
  );
};
