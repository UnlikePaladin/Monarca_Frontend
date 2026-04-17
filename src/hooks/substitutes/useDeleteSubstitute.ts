/**
 * Description: Hook to cancel an active substitute delegation by its ID via the API.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRequest } from "../../utils/apiService";

/**
 * Sends a DELETE request to cancel a substitute delegation.
 * @param substitutionId The unique identifier of the delegation to cancel.
 * @returns Promise resolving when the cancellation is confirmed.
 */
const deleteSubstitute = async (substitutionId: string): Promise<void> => {
  await deleteRequest(`/substitutes/${substitutionId}`);
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
      queryClient.invalidateQueries({ queryKey: ["substitutes"] });
    },
  });
};

/*
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 * - 2026-04-16 | Juan de Dios Gastélum Flores | Connected to real API endpoint DELETE /substitutes/:id.
 */