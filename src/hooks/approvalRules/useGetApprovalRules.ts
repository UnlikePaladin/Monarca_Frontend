/**
 * Description: Hook to fetch the list of approval rules for the current company.
 */

import { useQuery } from '@tanstack/react-query';
import { ApprovalRule } from '../../types/approvalRules';

const MOCK_RULES: ApprovalRule[] = [
  {
    id: 'rule_1',
    name: 'Viaje nacional estándar',
    isActive: true,
    conditions: [
      { field: 'trip_type', value: 'nacional' },
      { field: 'cost', operator: 'lte', value: 10000 },
    ],
    approvalChain: [
      { order: 1, roleId: 'role_1', roleName: 'Supervisor directo', requiredApprovals: 1 },
    ],
  },
  {
    id: 'rule_2',
    name: 'Viaje internacional de alto costo',
    isActive: true,
    conditions: [
      { field: 'trip_type', value: 'internacional' },
      { field: 'cost', operator: 'gt', value: 10000 },
    ],
    approvalChain: [
      { order: 1, roleId: 'role_1', roleName: 'Supervisor directo', requiredApprovals: 1 },
      { order: 2, roleId: 'role_2', roleName: 'Director de área', requiredApprovals: 1 },
    ],
  },
];

/**
 * Fetches all approval rules for the current company.
 * @returns Promise resolving to an array of ApprovalRule objects.
 */
const fetchApprovalRules = async (): Promise<ApprovalRule[]> => {
  // TODO: Reemplazar con llamada del API.
};

/**
 * Hook to retrieve all approval rules.
 * @returns Query result containing the rules array, loading state, and error.
 */
export const useGetApprovalRules = () => {
  return useQuery<ApprovalRule[]>({
    queryKey: ['approvalRules'],
    queryFn: fetchApprovalRules,
  });
};

/*
 * Modification History:
 * - 2026-04-08 | Juan de Dios Gastélum Flores | Initial file creation.
 */
