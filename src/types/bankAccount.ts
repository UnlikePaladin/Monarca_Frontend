export type BankAccount = {
  id: string;
  name: string;
  country: string;
  region: string;
  iban: string;
  identifierType?: string | null;
  identifierValue?: string | null;
  id_company?: string;
  updatedAt?: string;
};

export type CreateBankAccountPayload = {
  name: string;
  country: string;
  region: string;
  iban: string;
};
