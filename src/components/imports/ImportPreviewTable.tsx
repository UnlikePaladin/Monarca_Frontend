import { ReactNode } from 'react';

import {
  formatValidationMessage,
  normalizeValidationMessages,
} from '../../utils/excelImport';

type ImportTableColumn<T> = {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

type PreviewRow = {
  row: number;
  isUpdate?: boolean | null;
  validationErrors?: unknown;
  errors?: unknown;
  rowErrors?: unknown;
  fieldErrors?: unknown;
};

type ImportPreviewTableProps<T extends PreviewRow> = {
  rows: T[];
  columns: ImportTableColumn<T>[];
  emptyMessage: string;
  getRowKey: (row: T) => string;
  fieldLabels?: Record<string, string>;
  getValidationErrors?: (row: T) => unknown;
};

const ImportPreviewTable = <T extends PreviewRow>({
  rows,
  columns,
  emptyMessage,
  getRowKey,
  fieldLabels = {},
  getValidationErrors,
}: ImportPreviewTableProps<T>) => {
  const resolveErrors = (row: T) =>
    normalizeValidationMessages(
      getValidationErrors?.(row) ?? row.validationErrors ?? row.errors ?? row.rowErrors ?? row.fieldErrors,
    );

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
          <tr>
            <th className="px-3 py-3 text-left">Fila</th>
            <th className="px-3 py-3 text-left">Estado</th>
            {columns.map((column) => (
              <th key={column.header} className={`px-3 py-3 text-left ${column.className ?? ''}`}>
                {column.header}
              </th>
            ))}
            <th className="px-3 py-3 text-left min-w-[260px]">Errores</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + 3}
                className="px-3 py-6 text-center text-gray-400 text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          )}

          {rows.map((row) => {
            const rowErrors = resolveErrors(row);
            const hasErrors = rowErrors.length > 0;
            const statusLabel = row.isUpdate === true
              ? 'Actualiza'
              : row.isUpdate === false
                ? 'Crea'
                : 'Pendiente';

            return (
              <tr
                key={getRowKey(row)}
                className={hasErrors ? 'bg-red-50/50' : ''}
              >
                <td className="px-3 py-2 text-gray-500">{row.row}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${
                      row.isUpdate === true
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : row.isUpdate === false
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-gray-50 text-gray-600'
                    }`}
                  >
                    {statusLabel}
                  </span>
                </td>

                {columns.map((column) => (
                  <td
                    key={`${getRowKey(row)}-${column.header}`}
                    className={`px-3 py-2 text-gray-700 align-top ${column.className ?? ''}`}
                  >
                    {column.render(row)}
                  </td>
                ))}

                <td className="px-3 py-2 align-top">
                  {hasErrors ? (
                    <ul className="space-y-1 text-xs text-red-700">
                      {rowErrors.map((error, index) => (
                        <li key={`${getRowKey(row)}-error-${index}`} className="flex gap-2">
                          <span className="mt-0.5">•</span>
                          <span>{formatValidationMessage(error, fieldLabels)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-gray-400">Sin errores</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ImportPreviewTable;
