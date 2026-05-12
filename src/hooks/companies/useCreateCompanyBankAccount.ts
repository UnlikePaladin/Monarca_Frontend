import { useMutation, useQueryClient } from "@tanstack/react-query";

import { postRequest } from "../../utils/apiService";
import {
  BankAccount,
  CreateBankAccountPayload,
} from "../../types/bankAccount";

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const parseBankAccount = (value: unknown): BankAccount | null => {
  const raw = toRecord(value);

  const id = String(raw.id ?? "").trim();
  const name = String(raw.name ?? "").trim();
  const country = String(raw.country ?? "").trim();
  const region = String(raw.region ?? "").trim();
  const iban = String(raw.iban ?? raw.IBAN ?? "").trim();

  if (!id || !name || !country || !region || !iban) return null;

  return {
    id,
    name,
    country,
    region,
    iban,
    id_company:
      typeof raw.id_company === "string" && raw.id_company.trim()
        ? raw.id_company.trim()
        : undefined,
    updatedAt:
      typeof raw.updatedAt === "string" && raw.updatedAt.trim()
        ? raw.updatedAt.trim()
        : undefined,
  };
};

const createCompanyBankAccount = async (
  companyId: string,
  payload: CreateBankAccountPayload
): Promise<BankAccount> => {
  const response = await postRequest(`/companies/${companyId}/bank-accounts`, payload);
  const raw =
    (response as Record<string, unknown>)?.bankAccount ??
    (response as Record<string, unknown>)?.bank_account ??
    (response as Record<string, unknown>)?.data ??
    response;

  const parsed = parseBankAccount(raw);
  if (parsed) return parsed;

  return {
    id: `temp_${Date.now()}`,
    name: payload.name,
    country: payload.country,
    region: payload.region,
    iban: payload.iban,
  };
};

export const useCreateCompanyBankAccount = (companyId?: string) => {
  const queryClient = useQueryClient();

  return useMutation<BankAccount, Error, CreateBankAccountPayload>({
    mutationFn: (payload) => createCompanyBankAccount(companyId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["companyBankAccounts", companyId],
      });
    },
  });
};

export { createCompanyBankAccount };
