/**
 * Description: Hook to fetch all users from the API.
 */

import { useQuery } from "@tanstack/react-query";
import { getRequest } from "../../utils/apiService";

export interface UserSummary {
  id: string;
  name: string;
  lastName: string;
  email: string;
}

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const toString = (value: unknown): string =>
  typeof value === "string" ? value : "";

export const normalizeUser = (value: unknown): UserSummary | null => {
  const raw = toRecord(value);
  const id = toString(raw.id);
  if (!id) return null;
  return {
    id,
    name: toString(raw.name),
    lastName: toString(raw.lastName ?? raw.last_name),
    email: toString(raw.email),
  };
};

/**
 * Fetches all users from the backend.
 * @returns Promise resolving to an array of UserSummary objects.
 */
const fetchUsers = async (): Promise<UserSummary[]> => {
  const response = await getRequest("/users");
  const list = Array.isArray(response) ? response : [];
  return list
    .map((item) => normalizeUser(item))
    .filter((item): item is UserSummary => item !== null);
};

/**
 * Hook to retrieve the list of all users.
 * @returns Query result containing the users array, loading state, and error.
 */
export const useGetUsers = () => {
  return useQuery<UserSummary[]>({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });
};

/*
 * Modification History:
 * - 2026-04-16 | Juan de Dios Gastélum Flores | Initial file creation.
 */
