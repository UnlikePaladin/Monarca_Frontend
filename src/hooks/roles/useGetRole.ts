/**
 * Description: Hook to fetch a single role by its ID from the API.
 */

import { useQuery } from '@tanstack/react-query';
import { Role } from '../../types/auth';

/**
 * Fetches a single role by its unique identifier.
 * @param roleId The unique identifier of the role to retrieve.
 * @returns Promise resolving to a Role object.
 */
const fetchRole = async (roleId: string): Promise<Role> => {
  // TODO: replace with API call → return getRequest(`/roles/${roleId}`);
  return {
    id: roleId,
    name: 'Admin',
    description: 'Full system access',
    isActive: true,
    permissions: [
      { moduleId: 'mod_travel', moduleName: 'Solicitudes de Viaje', allowedActions: ['create', 'read', 'approve'] },
      { moduleId: 'mod_refunds', moduleName: 'Reembolsos', allowedActions: ['read'] },
    ],
  };
};

/**
 * Hook to retrieve a single role by ID. Only runs when a roleId is provided.
 * @param roleId The unique identifier of the role.
 * @returns Query result containing the role data, loading state, and error.
 */
export const useGetRole = (roleId: string) => {
  return useQuery<Role>({
    queryKey: ['role', roleId],
    queryFn: () => fetchRole(roleId),
    // Only fetch when an actual roleId is provided
    enabled: !!roleId,
  });
};

/*
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 */
