export type ImportValidationMessage = {
  field?: string;
  message: string;
};

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const pickString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const pickNumber = (...values: unknown[]): number => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
};

export const pickFirstArray = (
  source: Record<string, unknown>,
  keys: string[],
): unknown[] => {
  for (const key of keys) {
    const candidate = source[key];
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

export const normalizeValidationMessages = (
  value: unknown,
): ImportValidationMessage[] => {
  if (!value) return [];

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      return normalizeValidationMessages(parsed);
    } catch {
      return [{ message: trimmed }];
    }
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeValidationMessages(item));
  }

  const record = toRecord(value);
  const field = pickString(
    record.field,
    record.column,
    record.property,
    record.path,
    record.name,
    record.key,
  );
  const message = pickString(
    record.message,
    record.error,
    record.detail,
    record.text,
    record.reason,
  );

  if (message) {
    return [{ field: field || undefined, message }];
  }

  return Object.entries(record).flatMap(([key, nestedValue]) =>
    normalizeValidationMessages(nestedValue).map((item) => ({
      field: item.field ?? key,
      message: item.message,
    })),
  );
};

export const formatValidationMessage = (
  message: ImportValidationMessage,
  fieldLabels: Record<string, string> = {},
): string => {
  if (!message.field) return message.message;

  const translatedField = fieldLabels[message.field] ?? message.field;
  return `${translatedField}: ${message.message}`;
};

export const stripImportMetadata = <T extends Record<string, unknown>>(
  row: T,
  extraKeys: string[] = [],
): Record<string, unknown> => {
  const payload = { ...row };
  const keysToRemove = new Set([
    'row',
    'validationErrors',
    'errors',
    'rowErrors',
    'fieldErrors',
    ...extraKeys,
  ]);

  for (const key of keysToRemove) {
    delete payload[key];
  }

  return payload;
};

export const normalizePreviewResponse = <TRow>(
  response: unknown,
  rowKeys: string[],
  fallbackCounts?: { totalRows?: number; validRows?: number; errorRows?: number },
) => {
  const record = toRecord(response);
  const rows = Array.isArray(response)
    ? response
    : pickFirstArray(record, rowKeys);

  const totalRows = pickNumber(
    record.totalRows,
    record.total_rows,
    record.total,
    fallbackCounts?.totalRows,
    rows.length,
  );
  const validRows = pickNumber(
    record.validRows,
    record.valid_rows,
    fallbackCounts?.validRows,
    rows.length,
  );
  const errorRows = pickNumber(
    record.errorRows,
    record.error_rows,
    fallbackCounts?.errorRows,
    Math.max(totalRows - validRows, 0),
  );

  return {
    rows: rows as TRow[],
    totalRows,
    validRows,
    errorRows,
  };
};

export const normalizeImportResult = <TError>(response: unknown) => {
  const record = toRecord(response);
  const errors = pickFirstArray(record, ['errors', 'rowErrors', 'validationErrors', 'issues']);

  return {
    created: pickNumber(record.created, record.createdRows, record.created_count),
    updated: pickNumber(record.updated, record.updatedRows, record.updated_count),
    errors: errors as TError[],
  };
};
