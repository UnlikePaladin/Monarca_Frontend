import { useMutation, useQueryClient } from "@tanstack/react-query";

import { postRequest } from "../../utils/apiService";
import {
  CompanyDepartment,
  CreateCompanyDepartmentPayload,
} from "../../types/company";

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const parseDepartment = (value: unknown): CompanyDepartment | null => {
  const raw = toRecord(value);

  const id = String(raw.id ?? raw.departmentId ?? "").trim();
  const name = String(raw.name ?? "").trim();
  const costCenterRaw = raw.cost_center_id ?? (raw.cost_center as { id?: unknown })?.id;
  const cost_center_id = Number(costCenterRaw);

  if (!id || !name || Number.isNaN(cost_center_id)) return null;

  return {
    id,
    name,
    cost_center_id,
  };
};

const createCompanyDepartment = async (
  companyId: string,
  payload: CreateCompanyDepartmentPayload
): Promise<CompanyDepartment> => {
  const response = await postRequest(`/companies/${companyId}/departments`, payload);
  const raw =
    (response as Record<string, unknown>)?.department ??
    (response as Record<string, unknown>)?.data ??
    response;

  const parsed = parseDepartment(raw);
  if (parsed) return parsed;

  return {
    id: `temp_${Date.now()}`,
    ...payload,
  };
};

export const useCreateCompanyDepartment = (companyId?: string) => {
  const queryClient = useQueryClient();

  return useMutation<CompanyDepartment, Error, CreateCompanyDepartmentPayload>({
    mutationFn: (payload) => createCompanyDepartment(companyId as string, payload),
    onSuccess: () => {
      if (!companyId) return;

      queryClient.invalidateQueries({ queryKey: ["companyDepartments", companyId] });
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
    },
  });
};

export { createCompanyDepartment };
