/**
 * Description: Hook to create a new substitute delegation via the API.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SubstituteDelegation } from '../../types/auth';

type CreateSubstitutePayload = Omit<SubstituteDelegation, 'id'>;

/**
 * Sends a POST request to create a new substitute delegation.
 * @param payload Delegation data excluding the id field, which is assigned by the backend.
 * @returns Promise resolving to the created SubstituteDelegation object.
 */
const createSubstitute = async (payload: CreateSubstitutePayload): Promise<SubstituteDelegation> => {
  // TODO: replace with API call → return postRequest('/substitutes', payload);
  return { id: `sub_${Date.now()}`, ...payload };
};

/**
 * Hook to create a new substitute delegation. Invalidates the substitutes list cache on success.
 * @returns Mutation object with mutate function and isPending state.
 */
export const useCreateSubstitute = () => {
  const queryClient = useQueryClient();

  return useMutation<SubstituteDelegation, Error, CreateSubstitutePayload>({
    mutationFn: createSubstitute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['substitutes'] });
    },
  });
};

/*
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 */
