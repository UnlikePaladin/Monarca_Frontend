/**
 * Description: Hook to fetch the full list of roles from the API.
 */

import { useQuery } from '@tanstack/react-query';
import { Role } from '../../types/auth';

const MOCK_ROLES: Role[] = [
  { id: 'role_1', name: 'Administrador', description: 'Acceso completo al sistema', isActive: true, permissions: [] },
  { id: 'role_2', name: 'Aprobador', description: 'Puede aprobar solicitudes de viaje', isActive: true, permissions: [] },
  { id: 'role_3', name: 'Solicitante', description: 'Puede crear solicitudes de viaje', isActive: true, permissions: [] },
];

/**
 * Fetches all roles from the backend.
 * @returns Promise resolving to an array of Role objects.
 */
const fetchRoles = async (): Promise<Role[]> => {
  // TODO: replace with API call → return getRequest('/roles');
  return MOCK_ROLES;
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
