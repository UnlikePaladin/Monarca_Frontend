/**
 * Description: Hook to fetch the catalog of available modules and their possible actions.
 *              Used to dynamically build the permission matrix instead of hardcoding modules.
 */

import { useQuery } from '@tanstack/react-query';
import { ActionType } from '../../types/auth';

export interface AvailableModule {
  moduleId: string;
  moduleName: string;
  availableActions: ActionType[];
}

const MOCK_PERMISSIONS: AvailableModule[] = [
  {
    moduleId: 'mod_travel',
    moduleName: 'Solicitudes de Viaje',
    availableActions: ['create', 'read', 'update', 'delete', 'approve'],
  },
  {
    moduleId: 'mod_refunds',
    moduleName: 'Reembolsos',
    availableActions: ['create', 'read', 'update', 'approve'],
  },
  {
    moduleId: 'mod_bookings',
    moduleName: 'Reservaciones',
    availableActions: ['create', 'read', 'update', 'delete'],
  },
];

/**
 * Fetches the catalog of available modules and their supported actions.
 * @returns Promise resolving to an array of AvailableModule objects.
 */
const fetchPermissions = async (): Promise<AvailableModule[]> => {
  // TODO: replace with API call → return getRequest('/permissions');
  return MOCK_PERMISSIONS;
};

/**
 * Hook to retrieve all available modules and actions for building the permission matrix.
 * @returns Query result containing the permissions catalog, loading state, and error.
 */
export const useGetPermissions = () => {
  return useQuery<AvailableModule[]>({
    queryKey: ['permissions'],
    queryFn: fetchPermissions,
  });
};

/*
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 */
