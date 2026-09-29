import { useCallback, useEffect, useState } from 'react';
import {
  enqueueSnackbar,
  unmountFrontComponent,
  useFrontComponentExecutionContext,
  useSelectedRecordIds,
} from 'twenty-sdk/front-component';

type ListEntryField = {
  name: string;
  label: string;
  type: string;
  options: Array<{ label: string; value: string }>;
};

type MetadataGraphqlResponse<TData> = {
  data?: TData;
  errors?: Array<{ message: string }>;
};

const executeMetadataGraphql = async <TData,>(
  query: string,
  variables: Record<string, unknown>,
): Promise<TData> => {
  const processEnvironment = (
    globalThis as {
      process?: {
        env?: Record<string, string | undefined>;
      };
    }
  ).process?.env;
  const apiUrl = processEnvironment?.TWENTY_API_URL;
  const accessToken = processEnvironment?.TWENTY_APP_ACCESS_TOKEN;

  if (!apiUrl || !accessToken) {
    throw new Error('The metadata API connection is unavailable.');
  }

  const response = await fetch(`${apiUrl}/metadata`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const result = (await response.json()) as MetadataGraphqlResponse<TData>;

  if (result.errors?.length) {
    throw new Error(result.errors.map(({ message }) => message).join('\n'));
  }

  if (!response.ok || !result.data) {
    throw new Error(`Metadata request failed (${response.status}).`);
  }

  return result.data;
};

const styles = {
  root: {
    boxSizing: 'border-box' as const,
    color: 'var(--t-font-color-primary)',
    display: 'flex',
    flexDirection: 'column' as const,
    fontFamily: 'var(--t-font-family)',
    height: '100%',
  },
  header: {
    borderBottom: '1px solid var(--t-border-color-light)',
    padding: '16px',
  },
  title: { fontSize: '16px', fontWeight: 600, margin: 0 },
  subtitle: {
    color: 'var(--t-font-color-tertiary)',
    fontSize: '13px',
    margin: '6px 0 0',
  },
  body: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column' as const,
    gap: '14px',
    overflowY: 'auto' as const,
    padding: '16px',
  },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  label: {
    color: 'var(--t-font-color-secondary)',
    fontSize: '12px',
    fontWeight: 500,
  },
  input: {
    background: 'var(--t-background-secondary)',
    border: '1px solid var(--t-border-color-medium)',
    borderRadius: '6px',
    boxSizing: 'border-box' as const,
    color: 'var(--t-font-color-primary)',
    fontFamily: 'var(--t-font-family)',
    fontSize: '13px',
    minHeight: '36px',
    padding: '0 10px',
    width: '100%',
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
    minHeight: '34px',
    padding: '0 12px',
  },
  cancelButton: {
    background: 'var(--t-background-secondary)',
    color: 'var(--t-font-color-secondary)',
  },
  saveButton: {
    background: 'var(--t-color-blue)',
    color: 'var(--t-font-color-inverted)',
  },
  disabledButton: { cursor: 'not-allowed', opacity: 0.5 },
  message: { color: 'var(--t-font-color-tertiary)', fontSize: '13px' },
};

const readFieldValue = (value: unknown, type: string): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (type === 'DATE' && typeof value === 'string') {
    return value.slice(0, 10);
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return String(value);
  }

  return '';
};

export const EditRecordListEntry = () => {
  const selectedRecordIds = useSelectedRecordIds();
  const selectedObjectMetadata = useFrontComponentExecutionContext(
    (context) => context.selectedObjectMetadata ?? null,
  );
  const [fields, setFields] = useState<ListEntryField[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const close = useCallback(async () => {
    await unmountFrontComponent();
  }, []);

  const loadEntry = useCallback(async () => {
    if (
      selectedRecordIds.length !== 1 ||
      !selectedObjectMetadata?.nameSingular.startsWith('recordListEntry')
    ) {
      setError('Select one entry from a List to edit its fields.');
      setLoading(false);
      return;
    }

    try {
      const { recordListEntryForEditing: entry } =
        await executeMetadataGraphql<{
          recordListEntryForEditing?: {
            fields: ListEntryField[];
            values: Record<string, unknown>;
          };
        }>(
          `query RecordListEntryForEditing($entryObjectMetadataId: UUID!, $entryId: UUID!) {
            recordListEntryForEditing(entryObjectMetadataId: $entryObjectMetadataId, entryId: $entryId) {
              fields
              values
            }
          }`,
          {
            entryObjectMetadataId: selectedObjectMetadata.id,
            entryId: selectedRecordIds[0],
          },
        );

      if (!entry) {
        throw new Error('The selected list entry could not be loaded.');
      }

      setFields(entry.fields);
      setValues(
        Object.fromEntries(
          entry.fields.map((field) => [
            field.name,
            readFieldValue(entry.values[field.name], field.type),
          ]),
        ),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'List entry fields could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [selectedObjectMetadata, selectedRecordIds]);

  useEffect(() => {
    void loadEntry();
  }, [loadEntry]);

  const save = async () => {
    if (
      selectedRecordIds.length !== 1 ||
      !selectedObjectMetadata?.nameSingular.startsWith('recordListEntry')
    ) {
      return;
    }

    setSaving(true);
    try {
      const data = Object.fromEntries(
        fields.map((field) => {
          const value = values[field.name] ?? '';

          if (value.length === 0) {
            return [field.name, null];
          }

          if (field.type === 'NUMBER') {
            return [field.name, Number(value)];
          }

          if (field.type === 'BOOLEAN') {
            return [field.name, value === 'true'];
          }

          return [field.name, value];
        }),
      );

      await executeMetadataGraphql<{
        updateRecordListEntryFields: { id: string };
      }>(
        `mutation UpdateRecordListEntryFields($input: UpdateRecordListEntryFieldsInput!) {
          updateRecordListEntryFields(input: $input) { id }
        }`,
        {
          input: {
            entryObjectMetadataId: selectedObjectMetadata.id,
            entryId: selectedRecordIds[0],
            data,
          },
        },
      );
      await enqueueSnackbar({
        message: 'List entry updated.',
        variant: 'success',
      });
      await close();
    } catch (saveError) {
      await enqueueSnackbar({
        message:
          saveError instanceof Error
            ? saveError.message
            : 'List entry could not be updated.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={styles.root}>
      <header style={styles.header}>
        <h1 style={styles.title}>Edit list entry</h1>
        <p style={styles.subtitle}>
          Update every field attached to this entry.
        </p>
      </header>
      <section style={styles.body}>
        {loading ? (
          <p style={styles.message}>Loading list fields…</p>
        ) : error ? (
          <p style={styles.message} role="alert">
            {error}
          </p>
        ) : fields.length === 0 ? (
          <p style={styles.message}>This list has no editable fields.</p>
        ) : (
          fields.map((field) => (
            <label key={field.name} style={styles.field}>
              <span style={styles.label}>{field.label}</span>
              {field.type === 'SELECT' ? (
                <select
                  aria-label={field.label}
                  style={styles.input}
                  value={values[field.name] ?? ''}
                  onChange={(event) =>
                    setValues((currentValues) => ({
                      ...currentValues,
                      [field.name]: event.target.value,
                    }))
                  }
                >
                  <option value="">No value</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'BOOLEAN' ? (
                <select
                  aria-label={field.label}
                  style={styles.input}
                  value={values[field.name] ?? ''}
                  onChange={(event) =>
                    setValues((currentValues) => ({
                      ...currentValues,
                      [field.name]: event.target.value,
                    }))
                  }
                >
                  <option value="">No value</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : (
                <input
                  aria-label={field.label}
                  style={styles.input}
                  type={
                    field.type === 'DATE'
                      ? 'date'
                      : field.type === 'NUMBER'
                        ? 'number'
                        : 'text'
                  }
                  value={values[field.name] ?? ''}
                  onChange={(event) =>
                    setValues((currentValues) => ({
                      ...currentValues,
                      [field.name]: event.target.value,
                    }))
                  }
                />
              )}
            </label>
          ))
        )}
      </section>
      <footer style={styles.footer}>
        <button
          type="button"
          style={{ ...styles.button, ...styles.cancelButton }}
          onClick={() => void close()}
        >
          Cancel
        </button>
        <button
          type="button"
          style={{
            ...styles.button,
            ...styles.saveButton,
            ...(loading || saving || error ? styles.disabledButton : {}),
          }}
          disabled={loading || saving || Boolean(error)}
          onClick={() => void save()}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </footer>
    </main>
  );
};
