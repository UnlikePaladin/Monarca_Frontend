import { useMutation, useQueryClient } from "@tanstack/react-query";

import { postRequest } from "../../utils/apiService";
import {
  AccountingAccount,
  CreateAccountingAccountPayload,
} from "../../types/accountingAccount";

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1";
  }
  return false;
};

const parseAccountingAccount = (value: unknown): AccountingAccount | null => {
  const raw = toRecord(value);

  const id = String(raw.id ?? "").trim();
  const key = String(raw.key ?? "").trim();
  const description = String(raw.description ?? "").trim();

  if (!id || !key || !description) return null;

  return {
    id,
    key,
    description,
    requiresCostCenter: toBoolean(raw.requiresCostCenter ?? raw.requires_cost_center),
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

const createCompanyAccountingAccount = async (
  companyId: string,
  payload: CreateAccountingAccountPayload
): Promise<AccountingAccount> => {
  // API expects idBankAccount; include it if provided
  const requestPayload = {
    key: payload.key,
    description: payload.description,
    requiresCostCenter: payload.requiresCostCenter,
    ...(payload.bankAccountId ? { idBankAccount: payload.bankAccountId } : {}),
  };

  const response = await postRequest(`/companies/${companyId}/accounting-accounts`, requestPayload);
  const raw =
    (response as Record<string, unknown>)?.accountingAccount ??
    (response as Record<string, unknown>)?.accounting_account ??
    (response as Record<string, unknown>)?.data ??
    response;

  const parsed = parseAccountingAccount(raw);
  if (parsed) return parsed;

  return {
    id: `temp_${Date.now()}`,
    key: payload.key,
    description: payload.description,
    requiresCostCenter: Boolean(payload.requiresCostCenter),
    bankAccountId: payload.bankAccountId,
  };
};

export const useCreateCompanyAccountingAccount = (companyId?: string) => {
  const queryClient = useQueryClient();

  return useMutation<AccountingAccount, Error, CreateAccountingAccountPayload>({
    mutationFn: (payload) => createCompanyAccountingAccount(companyId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["companyAccountingAccounts", companyId],
      });
    },
  });
};

export { createCompanyAccountingAccount };
