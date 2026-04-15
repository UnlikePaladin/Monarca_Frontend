/**
 * Description: Hook to fetch the full list of roles from the API.
 */

import { useQuery } from '@tanstack/react-query';
import { Role } from '../../types/auth';
import { getRequest } from '../../utils/apiService';
import { normalizeRole, pickFirstArray } from './roleMappers';

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

/**
 * Fetches all roles from the backend.
 * @returns Promise resolving to an array of Role objects.
 */
const fetchRoles = async (): Promise<Role[]> => {
  const response = await getRequest('/roles');
  const payload = toRecord(response);

  const rolesRaw = Array.isArray(response)
    ? response
    : pickFirstArray(payload, ['roles', 'data']);

  return rolesRaw
    .map((item) => normalizeRole(item))
    .filter((item): item is Role => item !== null);
};

/**
 * Hook to retrieve the list of all roles.
 * @returns Query result containing the roles array, loading state, and error.
 */
export const useGetRoles = () => {
  return useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  });
};

/*
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 */
