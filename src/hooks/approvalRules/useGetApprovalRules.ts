/**
 * Description: Hook to fetch the list of approval rules for the current company.
 */

import { useQuery } from "@tanstack/react-query";
import { getRequest } from "../../utils/apiService";
import { ApprovalRule } from "../../types/approvalRules";

/**
 * Fetches all approval rules from the API.
 * @returns Promise resolving to an array of ApprovalRule objects.
 */
const fetchApprovalRules = async (): Promise<ApprovalRule[]> => {
  return getRequest("/approval-rules");
};

/**
 * Hook to retrieve all approval rules.
 * @returns Query result containing the rules array, loading state, and error.
 */
export const useGetApprovalRules = () => {
  return useQuery<ApprovalRule[]>({
    queryKey: ["approvalRules"],
    queryFn: fetchApprovalRules,
  });
};

/*
 * Modification History:
 * - 2026-04-08 | Juan de Dios Gastélum | Initial file creation.
 * - 2026-05-12 | Juan de Dios Gastélum | Replaced mock data with real API call.
 */
