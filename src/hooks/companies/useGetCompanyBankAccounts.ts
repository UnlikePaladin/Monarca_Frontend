import { useQuery } from "@tanstack/react-query";

import { getRequest } from "../../utils/apiService";
import { BankAccount } from "../../types/bankAccount";

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const pickFirstArray = (source: Record<string, unknown>, keys: string[]): unknown[] => {
  for (const key of keys) {
    const candidate = source[key];
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

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

const listCompanyBankAccounts = async (
  companyId: string
): Promise<BankAccount[]> => {
  const response = await getRequest(`/companies/${companyId}/bank-accounts`);
  const payload = toRecord(response);

  const rawBankAccounts = Array.isArray(response)
    ? response
    : pickFirstArray(payload, ["bankAccounts", "bank_accounts", "data"]);

  return rawBankAccounts
    .map((item) => parseBankAccount(item))
    .filter((item): item is BankAccount => item !== null);
};

export const useGetCompanyBankAccounts = (companyId?: string) =>
  useQuery<BankAccount[]>({
    queryKey: ["companyBankAccounts", companyId],
    queryFn: () => listCompanyBankAccounts(companyId as string),
    enabled: Boolean(companyId),
  });

export { listCompanyBankAccounts };
