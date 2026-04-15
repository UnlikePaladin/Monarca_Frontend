/**
 * Description: Hook to delete a role by its ID via the API.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteRequest } from '../../utils/apiService';

/**
 * Sends a DELETE request to remove a role.
 * @param roleId The unique identifier of the role to delete.
 * @returns Promise resolving when the deletion is confirmed.
 */
const deleteRole = async (roleId: string): Promise<void> => {
  await deleteRequest(`/roles/${roleId}`);
};

/**
 * Hook to delete a role by ID. Invalidates the roles list cache on success.
 * @returns Mutation object with mutate function and isPending state.
 */
export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

/*
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 */
