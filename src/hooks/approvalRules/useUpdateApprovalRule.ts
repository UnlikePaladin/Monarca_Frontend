/**
 * Description: Hook to update an existing approval rule via the API.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApprovalRule } from '../../types/approvalRules';

interface UpdateApprovalRulePayload {
  ruleId: string;
  data: Omit<ApprovalRule, 'id'>;
}

/**
 * Sends a PATCH request to update an existing approval rule.
 * @param payload Rule ID and updated data.
 * @returns Promise resolving to the updated ApprovalRule object.
 */
const updateApprovalRule = async ({ ruleId, data }: UpdateApprovalRulePayload): Promise<ApprovalRule> => {
    // TODO: Reemplazar con llamada del API.
    return { id: ruleId, ...data };
};

/**
 * Hook to update an approval rule. Invalidates the rules list cache on success.
 * @returns Mutation object with mutate function and isPending state.
 */
export const useUpdateApprovalRule = () => {
  const queryClient = useQueryClient();

  return useMutation<ApprovalRule, Error, UpdateApprovalRulePayload>({
    mutationFn: updateApprovalRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvalRules'] });
    },
  });
};

/*
 * Modification History:
 * - 2026-04-08 | Juan de Dios Gastélum Flores | Initial file creation.
 */
