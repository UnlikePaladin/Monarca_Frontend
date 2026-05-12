export type BankAccount = {
  id: string;
  name: string;
  country: string;
  region: string;
  iban: string;
  id_company?: string;
  updatedAt?: string;
};

export type CreateBankAccountPayload = {
  name: string;
  country: string;
  region: string;
  iban: string;
};
