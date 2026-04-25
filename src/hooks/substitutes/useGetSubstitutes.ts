/**
 * Description: Hook to fetch the list of active substitute delegations for the current user.
 */

import { useQuery } from "@tanstack/react-query";
import { SubstituteDelegation } from "../../types/auth";
import { getRequest } from "../../utils/apiService";

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const toString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const normalizeSubstitute = (value: unknown): SubstituteDelegation | null => {
  const raw = toRecord(value);
  const id = toString(raw.id);
  if (!id) return null;
  return {
    id,
    roleId: toString(raw.roleId),
    targetUserId: toString(raw.targetUserId),
    startDate: toString(raw.startDate),
    endDate: toString(raw.endDate),
    notes: toString(raw.notes) || undefined,
  };
};

/**
 * Fetches all active substitute delegations from the API.
 * @returns Promise resolving to an array of SubstituteDelegation objects.
 */
const fetchSubstitutes = async (): Promise<SubstituteDelegation[]> => {
  const response = await getRequest("/substitutes");
  const list = Array.isArray(response) ? response : [];
  return list
    .map((item) => normalizeSubstitute(item))
    .filter((item): item is SubstituteDelegation => item !== null);
};

/**
 * Hook to retrieve the current user's active substitute delegations.
 * @returns Query result containing the delegations array, loading state, and error.
 */
export const useGetSubstitutes = () => {
  return useQuery<SubstituteDelegation[]>({
    queryKey: ["substitutes"],
    queryFn: fetchSubstitutes,
  });
};

/*
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 * - 2026-04-16 | Juan de Dios Gastélum Flores | Connected to real API endpoint GET /substitutes.
 */
