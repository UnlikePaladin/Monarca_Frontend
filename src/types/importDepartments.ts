import type { ImportValidationMessage } from '../utils/excelImport';

export type DepartmentImportPreviewRow = {
  row: number;
  name: string;
  cost_center_id: number | string;
  costCenterName?: string | null;
  isUpdate?: boolean;
  validationErrors?: ImportValidationMessage[] | string[];
  [key: string]: unknown;
};

export type DepartmentImportPreviewResponse = {
  rows: DepartmentImportPreviewRow[];
  totalRows: number;
  validRows: number;
  errorRows: number;
};

export type DepartmentImportConfirmRow = Record<string, unknown>;

export type DepartmentImportConfirmPayload = {
  departments: DepartmentImportConfirmRow[];
};

export type DepartmentImportResultError = {
  row?: number | string | null;
  identifier?: string | null;
  field?: string | null;
  message: string;
};

export type DepartmentImportResult = {
  created: number;
  updated: number;
  errors: DepartmentImportResultError[];
};
