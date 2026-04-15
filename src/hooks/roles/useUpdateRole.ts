/**
 * Description: Hook to update an existing role via the API.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Role } from '../../types/auth';
import { patchRequest } from '../../utils/apiService';
import { normalizeRole } from './roleMappers';

interface UpdateRolePayload {
  roleId: string;
  data: Partial<Omit<Role, 'id'>>;
}

/**
 * Sends a PATCH request to update a role's fields.
 * @param roleId The ID of the role to update.
 * @param data Partial role fields to apply.
 * @returns Promise resolving to the updated Role object.
 */
const updateRole = async ({ roleId, data }: UpdateRolePayload): Promise<Role> => {
  const response = await patchRequest(`/roles/${roleId}`, data);
  const raw =
    (response as Record<string, unknown>)?.role ??
    (response as Record<string, unknown>)?.data ??
    response;

  const normalized = normalizeRole(raw);
  if (normalized) return normalized;

  return {
    id: roleId,
    name: '',
    description: '',
    isActive: true,
    permissions: [],
    ...data,
  };
};

/**
 * Hook to update an existing role. Invalidates both the list and the specific role cache on success.
 * @returns Mutation object with mutate function and isPending state.
 */
export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation<Role, Error, UpdateRolePayload>({
    mutationFn: updateRole,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', variables.roleId] });
    },
  });
};

/*
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 */
