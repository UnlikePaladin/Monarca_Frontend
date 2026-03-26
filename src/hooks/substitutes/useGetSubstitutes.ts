/**
 * Description: Hook to fetch the list of active substitute delegations for the current user.
 */

import { useQuery } from '@tanstack/react-query';
import { SubstituteDelegation } from '../../types/auth';

const MOCK_SUBSTITUTES: SubstituteDelegation[] = [
  {
    id: 'sub_1',
    roleId: 'role_2',
    targetUserId: 'usr_1',
    startDate: '2026-04-01',
    endDate: '2026-04-07',
    notes: 'Semana de vacaciones',
  },
];

/**
 * Fetches all active substitute delegations belonging to the current user.
 * @returns Promise resolving to an array of SubstituteDelegation objects.
 */
const fetchSubstitutes = async (): Promise<SubstituteDelegation[]> => {
  // TODO: replace with API call → return getRequest('/substitutes');
  return MOCK_SUBSTITUTES;
};

/**
 * Hook to retrieve the current user's active substitute delegations.
 * @returns Query result containing the delegations array, loading state, and error.
 */
export const useGetSubstitutes = () => {
  return useQuery<SubstituteDelegation[]>({
    queryKey: ['substitutes'],
    queryFn: fetchSubstitutes,
  });
};

/*
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 */
