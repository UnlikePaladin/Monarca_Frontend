import { useMutation, useQueryClient } from "@tanstack/react-query";

import { postRequest } from "../../utils/apiService";
import { Company, CreateCompanyPayload } from "../../types/company";

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

const createCompany = async (payload: CreateCompanyPayload): Promise<Company> => {
  const response = await postRequest("/companies", payload);
  const raw =
    (response as Record<string, unknown>)?.company ??
    (response as Record<string, unknown>)?.data ??
    response;

  const parsed = parseCompany(raw);
  if (parsed) return parsed;

  return {
    id: `temp_${Date.now()}`,
    key: payload.key,
    name: payload.name,
    localCurrency: payload.localCurrency,
  };
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation<Company, Error, CreateCompanyPayload>({
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
};

export { createCompany };
