import { useQuery } from "@tanstack/react-query";

import { getRequest } from "../../utils/apiService";
import { Company } from "../../types/company";

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const parseCompany = (value: unknown): Company | null => {
  const raw = toRecord(value);

  const id = String(raw.id ?? raw.companyId ?? "").trim();
  const key = String(raw.key ?? "").trim();
  const name = String(raw.name ?? "").trim();
  const localCurrency = String(raw.localCurrency ?? raw.currency ?? "").trim();

  if (!id || !key || !name || !localCurrency) return null;

  return {
    id,
    key,
    name,
    localCurrency,
  };
};

const getCompany = async (companyId: string): Promise<Company> => {
  const response = await getRequest(`/companies/${companyId}`);
  const raw =
    (response as Record<string, unknown>)?.company ??
    (response as Record<string, unknown>)?.data ??
    response;

  const company = parseCompany(raw);
  if (!company) {
    throw new Error("Invalid company response");
  }

  return company;
};

export const useGetCompany = (companyId?: string) =>
  useQuery<Company>({
    queryKey: ["company", companyId],
    queryFn: () => getCompany(companyId as string),
    enabled: Boolean(companyId),
  });

export { getCompany };
