import type { ImportValidationMessage } from '../utils/excelImport';

export type CostCenterImportPreviewRow = {
  row: number;
  numericId?: number | null;
  key?: string | null;
  name: string;
  isUpdate?: boolean;
  validationErrors?: ImportValidationMessage[] | string[];
  [key: string]: unknown;
};

export type CostCenterImportPreviewResponse = {
  rows: CostCenterImportPreviewRow[];
  totalRows: number;
  validRows: number;
  errorRows: number;
};

export type CostCenterImportConfirmRow = Record<string, unknown>;

export type CostCenterImportConfirmPayload = {
  costCenters: CostCenterImportConfirmRow[];
};

export type CostCenterImportResultError = {
  row?: number | string | null;
  identifier?: string | null;
  field?: string | null;
  message: string;
};

export type CostCenterImportResult = {
  created: number;
  updated: number;
  errors: CostCenterImportResultError[];
};
