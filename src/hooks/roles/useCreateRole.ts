/**
 * Description: Hook to create a new role via the API.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Role } from '../../types/auth';

type CreateRolePayload = Omit<Role, 'id'>;

/**
 * Sends a POST request to create a new role.
 * @param payload Role data excluding the id field, which is assigned by the backend.
 * @returns Promise resolving to the created Role object.
 */
const createRole = async (payload: CreateRolePayload): Promise<Role> => {
  // TODO: replace with API call → return postRequest('/roles', payload);
  return { id: `role_${Date.now()}`, ...payload };
};

/**
 * Hook to create a new role. Invalidates the roles list cache on success.
 * @returns Mutation object with mutate function and isPending state.
 */
export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation<Role, Error, CreateRolePayload>({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

/*
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 */
