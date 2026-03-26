/**
 * Description: Hook to cancel an active substitute delegation by its ID via the API.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Sends a DELETE request to cancel a substitute delegation.
 * @param substitutionId The unique identifier of the delegation to cancel.
 * @returns Promise resolving when the cancellation is confirmed.
 */
const deleteSubstitute = async (substitutionId: string): Promise<void> => {
  // TODO: replace with API call → return deleteRequest(`/substitutes/${substitutionId}`);
};

/**
 * Hook to cancel a substitute delegation by ID. Invalidates the substitutes list cache on success.
 * @returns Mutation object with mutate function and isPending state.
 */
export const useDeleteSubstitute = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteSubstitute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['substitutes'] });
    },
  });
};

/*
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 */
