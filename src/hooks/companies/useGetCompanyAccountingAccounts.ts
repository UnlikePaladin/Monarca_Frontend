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

const pickFirstArray = (source: Record<string, unknown>, keys: string[]): unknown[] => {
  for (const key of keys) {
    const candidate = source[key];
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
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

const listCompanyAccountingAccounts = async (
  companyId: string
): Promise<AccountingAccount[]> => {
  const response = await getRequest(`/companies/${companyId}/accounting-accounts`);
  const payload = toRecord(response);

  const rawAccountingAccounts = Array.isArray(response)
    ? response
    : pickFirstArray(payload, ["accountingAccounts", "accounting_accounts", "data"]);

  return rawAccountingAccounts
    .map((item) => parseAccountingAccount(item))
    .filter((item): item is AccountingAccount => item !== null);
};

export const useGetCompanyAccountingAccounts = (companyId?: string) =>
  useQuery<AccountingAccount[]>({
    queryKey: ["companyAccountingAccounts", companyId],
    queryFn: () => listCompanyAccountingAccounts(companyId as string),
    enabled: Boolean(companyId),
  });

export { listCompanyAccountingAccounts };
