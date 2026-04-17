import { useQuery } from "@tanstack/react-query";

import { getRequest } from "../../utils/apiService";
import { Company } from "../../types/company";

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const pickFirstArray = (source: Record<string, unknown>, keys: string[]): unknown[] => {
  for (const key of keys) {
    const candidate = source[key];
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

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

const listCompanies = async (): Promise<Company[]> => {
  const response = await getRequest("/companies");
  const payload = toRecord(response);

  const rawCompanies = Array.isArray(response)
    ? response
    : pickFirstArray(payload, ["companies", "data"]);

  return rawCompanies
    .map((item) => parseCompany(item))
    .filter((item): item is Company => item !== null);
};

export const useGetCompanies = () =>
  useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: listCompanies,
  });

export { listCompanies };
