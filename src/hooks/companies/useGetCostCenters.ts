import { useQuery } from "@tanstack/react-query";

import { getRequest } from "../../utils/apiService";
import { CostCenter } from "../../types/costCenter";

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const pickFirstArray = (source: Record<string, unknown>, keys: string[]): unknown[] => {
  for (const key of keys) {
    const candidate = source[key];
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

const parsePositiveInteger = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return undefined;

  return parsed;
};

const parseCostCenter = (value: unknown): CostCenter | null => {
  const raw = toRecord(value);

  const id = String(raw.id ?? raw.costCenterId ?? "").trim();
  const name = String(raw.name ?? "").trim();
  const numericId = parsePositiveInteger(raw.numericId ?? raw.numeric_id);
  const keyRaw = raw.key;
  const key = typeof keyRaw === "string" && keyRaw.trim() ? keyRaw.trim() : undefined;

  if (!id || !name) return null;

  return {
    id,
    name,
    numericId,
    key,
  };
};

const listCostCenters = async (): Promise<CostCenter[]> => {
  const response = await getRequest("/cost-centers");
  const payload = toRecord(response);

  const rawCostCenters = Array.isArray(response)
    ? response
    : pickFirstArray(payload, ["costCenters", "cost_centers", "data"]);

  return rawCostCenters
    .map((item) => parseCostCenter(item))
    .filter((item): item is CostCenter => item !== null);
};

export const useGetCostCenters = () =>
  useQuery<CostCenter[]>({
    queryKey: ["costCenters"],
    queryFn: listCostCenters,
  });

export { listCostCenters };