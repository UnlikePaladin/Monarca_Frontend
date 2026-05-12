import { useQuery } from "@tanstack/react-query";

import { getRequest } from "../../utils/apiService";
import { AccountingAccount } from "../../types/accountingAccount";

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
  const bankAccountId = String(
    raw.idBankAccount ?? raw.bankAccountId ?? raw.id_bank_account ?? (raw.bank_account && (raw.bank_account as Record<string, unknown>).id) ?? ""
  ).trim();

  if (!id || !key || !description) return null;

  return {
    id,
    key,
    description,
    requiresCostCenter: toBoolean(raw.requiresCostCenter ?? raw.requires_cost_center),
    bankAccountId: bankAccountId || undefined,
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

const getCompanyAccountingAccount = async (
  companyId: string,
  accountingAccountId: string
): Promise<AccountingAccount | null> => {
  const response = await getRequest(`/companies/${companyId}/accounting-accounts/${accountingAccountId}`);
  const raw = toRecord(response);

  const candidate =
    (raw.accountingAccount ?? raw.accounting_account ?? raw.data) as unknown;

  return parseAccountingAccount(candidate ?? raw) ?? null;
};

export const useGetCompanyAccountingAccount = (companyId?: string, accountingAccountId?: string) =>
  useQuery<AccountingAccount | null>({
    queryKey: ["companyAccountingAccount", companyId, accountingAccountId],
    queryFn: () => getCompanyAccountingAccount(companyId as string, accountingAccountId as string),
    enabled: Boolean(companyId && accountingAccountId),
  });

export { getCompanyAccountingAccount };
