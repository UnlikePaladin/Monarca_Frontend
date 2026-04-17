import { useQuery } from "@tanstack/react-query";

import { getRequest } from "../../utils/apiService";
import { CompanyDepartment } from "../../types/company";

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const pickFirstArray = (source: Record<string, unknown>, keys: string[]): unknown[] => {
  for (const key of keys) {
    const candidate = source[key];
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

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

const listCompanyDepartments = async (companyId: string): Promise<CompanyDepartment[]> => {
  const response = await getRequest(`/companies/${companyId}/departments`);
  const payload = toRecord(response);

  const rawDepartments = Array.isArray(response)
    ? response
    : pickFirstArray(payload, ["departments", "data"]);

  return rawDepartments
    .map((item) => parseDepartment(item))
    .filter((item): item is CompanyDepartment => item !== null);
};

export const useGetCompanyDepartments = (companyId?: string) =>
  useQuery<CompanyDepartment[]>({
    queryKey: ["companyDepartments", companyId],
    queryFn: () => listCompanyDepartments(companyId as string),
    enabled: Boolean(companyId),
  });

export { listCompanyDepartments };
