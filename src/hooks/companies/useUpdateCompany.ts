import { useMutation, useQueryClient } from "@tanstack/react-query";

import { patchRequest } from "../../utils/apiService";
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

type UpdateCompanyPayload = Partial<{
  key: string;
  name: string;
  localCurrency: string;
}>;

const updateCompany = async (
  companyId: string,
  payload: UpdateCompanyPayload
): Promise<Company> => {
  const response = await patchRequest(`/companies/${companyId}`, payload);
  const raw =
    (response as Record<string, unknown>)?.company ??
    (response as Record<string, unknown>)?.data ??
    response;

  const parsed = parseCompany(raw);
  if (parsed) return parsed;

  throw new Error("Invalid company response");
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation<Company, Error, { companyId: string; payload: UpdateCompanyPayload }>({
    mutationFn: ({ companyId, payload }) => updateCompany(companyId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["company", data.id] });
    },
  });
};

export { updateCompany };
