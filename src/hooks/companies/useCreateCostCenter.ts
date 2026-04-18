import { useMutation, useQueryClient } from "@tanstack/react-query";

import { postRequest } from "../../utils/apiService";
import {
  CostCenter,
  CreateCostCenterPayload,
} from "../../types/costCenter";

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

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

const createCostCenter = async (payload: CreateCostCenterPayload): Promise<CostCenter> => {
  const response = await postRequest("/cost-centers", payload);
  const raw =
    (response as Record<string, unknown>)?.costCenter ??
    (response as Record<string, unknown>)?.cost_center ??
    (response as Record<string, unknown>)?.data ??
    response;

  const parsed = parseCostCenter(raw);
  if (parsed) return parsed;

  return {
    id: `temp_${Date.now()}`,
    ...payload,
  };
};

export const useCreateCostCenter = () => {
  const queryClient = useQueryClient();

  return useMutation<CostCenter, Error, CreateCostCenterPayload>({
    mutationFn: createCostCenter,
    onSuccess: (createdCostCenter) => {
      queryClient.setQueryData<CostCenter[]>(["costCenters"], (currentCostCenters = []) => {
        if (
          currentCostCenters.some(
            (costCenter) => costCenter.id === createdCostCenter.id
          )
        ) {
          return currentCostCenters;
        }

        return [...currentCostCenters, createdCostCenter];
      });

      queryClient.invalidateQueries({ queryKey: ["costCenters"] });
    },
  });
};

export { createCostCenter };