/**
 * Description: Hook to fetch only users with the Aprobador role.
 */

import { useQuery } from "@tanstack/react-query";
import { getRequest } from "../../utils/apiService";
import { UserSummary, normalizeUser } from "./useGetUsers";

const fetchApprovers = async (): Promise<UserSummary[]> => {
  const response = await getRequest("/users?roleName=Aprobador");
  const list = Array.isArray(response) ? response : [];
  return list
    .map((item) => normalizeUser(item))
    .filter((item): item is UserSummary => item !== null);
};

export const useGetApprovers = () => {
  return useQuery<UserSummary[]>({
    queryKey: ["users", "approvers"],
    queryFn: fetchApprovers,
  });
};

/*
 * Modification History:
 * - 2026-05-13 | Juan de Dios Gastélum | Initial file creation.
 */
