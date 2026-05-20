import type { ImportValidationMessage } from '../utils/excelImport';

export type AccountingAccountImportPreviewRow = {
  row: number;
  key?: string | null;
  description?: string | null;
  requiresCostCenter?: boolean;
  idBankAccount?: string | null;
  bankAccountName?: string | null;
  isUpdate: boolean;
  validationErrors?: ImportValidationMessage[] | string[];
  [key: string]: unknown;
};

export type AccountingAccountImportPreviewResponse = {
  rows: AccountingAccountImportPreviewRow[];
  totalRows: number;
  validRows: number;
  errorRows: number;
};

export type AccountingAccountImportConfirmRow = {
  row?: number;
  key: string;
  description: string;
  requiresCostCenter?: boolean;
  idBankAccount?: string | null;
  isUpdate?: boolean;
};

export type AccountingAccountImportConfirmPayload = {
  accounts: AccountingAccountImportConfirmRow[];
};

export type AccountingAccountImportResultError = {
  row?: number | string | null;
  message: string;
};

export type AccountingAccountImportResult = {
  created: number;
  updated: number;
  errors: AccountingAccountImportResultError[];
};
