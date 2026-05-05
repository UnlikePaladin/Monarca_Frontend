export type AccountingAccount = {
  id: string;
  key: string;
  description: string;
  requiresCostCenter: boolean;
  bankAccountId?: string;
  id_company?: string;
  updatedAt?: string;
};

export type CreateAccountingAccountPayload = {
  key: string;
  description: string;
  requiresCostCenter?: boolean;
  bankAccountId?: string;
};
