/**
 * Description: Hook to fetch a single role by its ID from the API.
 */

import { useQuery } from '@tanstack/react-query';
import { Role } from '../../types/auth';
import { getRequest } from '../../utils/apiService';
import { normalizeRole } from './roleMappers';

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

/**
 * Fetches a single role by its unique identifier.
 * @param roleId The unique identifier of the role to retrieve.
 * @returns Promise resolving to a Role object.
 */
const fetchRole = async (roleId: string): Promise<Role> => {
  const response = await getRequest(`/roles/${roleId}`);
  const payload = toRecord(response);
  const roleRaw = payload.role ?? payload.data ?? response;
  const role = normalizeRole(roleRaw);

  if (!role) {
    throw new Error('No se pudo normalizar el rol solicitado');
  }

  return role;
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
