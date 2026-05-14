/**
 * Description: Hook to delete an approval rule by its ID via the API.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRequest } from "../../utils/apiService";

/**
 * Sends a DELETE request to remove an approval rule.
 * @param ruleId The unique identifier of the rule to delete.
 */
const deleteApprovalRule = async (ruleId: string): Promise<void> => {
  return deleteRequest(`/approval-rules/${ruleId}`);
};

/**
 * Hook to delete an approval rule by ID. Invalidates the rules list cache on success.
 * @returns Mutation object with mutate function and isPending state.
 */
export const useDeleteApprovalRule = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteApprovalRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvalRules"] });
    },
  });
};

/*
 * Modification History:
 * - 2026-04-08 | Juan de Dios Gastélum | Initial file creation.
 * - 2026-05-12 | Juan de Dios Gastélum | Replaced TODO with real API call.
 */
