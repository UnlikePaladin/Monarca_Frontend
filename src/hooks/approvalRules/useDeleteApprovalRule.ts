/**
 * Description: Hook to delete an approval rule by its ID via the API.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Sends a DELETE request to remove an approval rule.
 * @param ruleId The unique identifier of the rule to delete.
 * @returns Promise resolving when the deletion is confirmed.
 */
const deleteApprovalRule = async (ruleId: string): Promise<void> => {
  // TODO: Reemplazar con llamada del API.
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
      queryClient.invalidateQueries({ queryKey: ['approvalRules'] });
    },
  });
};

/*
 * Modification History:
 * - 2026-04-08 | Juan de Dios Gastélum Flores | Initial file creation.
 */
