/**
 * Description: Hook to create a new approval rule via the API.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApprovalRule } from '../../types/approvalRules';

type CreateApprovalRulePayload = Omit<ApprovalRule, 'id'>;

/**
 * Sends a POST request to create a new approval rule.
 * @param payload Rule data excluding the id field.
 * @returns Promise resolving to the created ApprovalRule object.
 */
const createApprovalRule = async (payload: CreateApprovalRulePayload): Promise<ApprovalRule> => {
  // TODO: Reemplazar con llamada del API.
  return { id: `rule_${Date.now()}`, ...payload };
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
      queryClient.invalidateQueries({ queryKey: ['approvalRules'] });
    },
  });
};

/*
 * Modification History:
 * - 2026-04-08 | Juan de Dios Gastélum Flores | Initial file creation.
 */
