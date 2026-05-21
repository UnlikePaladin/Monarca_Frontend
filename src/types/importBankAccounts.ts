import type { ImportValidationMessage } from '../utils/excelImport';

export type BankAccountImportPreviewRow = {
  row: number;
  name: string;
  country: string;
  region: string;
  iban?: string | null;
  identifierType?: string | null;
  identifierValue?: string | null;
  isUpdate?: boolean;
  validationErrors?: ImportValidationMessage[] | string[];
  [key: string]: unknown;
};

export type BankAccountImportPreviewResponse = {
  rows: BankAccountImportPreviewRow[];
  totalRows: number;
  validRows: number;
  errorRows: number;
};

export type BankAccountImportConfirmRow = Record<string, unknown>;

export type BankAccountImportConfirmPayload = {
  accounts: BankAccountImportConfirmRow[];
};

export type BankAccountImportResultError = {
  row?: number | string | null;
  identifier?: string | null;
  field?: string | null;
  message: string;
};

export type BankAccountImportResult = {
  created: number;
  updated: number;
  errors: BankAccountImportResultError[];
};
