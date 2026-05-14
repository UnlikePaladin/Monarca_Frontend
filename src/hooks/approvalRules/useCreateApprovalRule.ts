/**
 * Description: Hook to create a new approval rule via the API.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postRequest } from "../../utils/apiService";
import { ApprovalRule } from "../../types/approvalRules";

type CreateApprovalRulePayload = Omit<ApprovalRule, "id">;

/**
 * Sends a POST request to create a new approval rule.
 * @param payload Rule data excluding the id field.
 * @returns Promise resolving to the created ApprovalRule.
 */
const createApprovalRule = async (
  payload: CreateApprovalRulePayload,
): Promise<ApprovalRule> => {
  return postRequest(
    "/approval-rules",
    payload as Record<string, unknown>,
  );
};

/**
 * Hook to create a new approval rule. Invalidates the rules list cache on success.
 * @returns Mutation object with mutate function and isPending state.
 */
export const useCreateApprovalRule = () => {
  const queryClient = useQueryClient();

  return useMutation<ApprovalRule, Error, CreateApprovalRulePayload>({
    mutationFn: createApprovalRule,
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
