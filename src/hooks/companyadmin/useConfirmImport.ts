/**
 * File: useConfirmImport.ts
 * Description: React Query mutation hook that persists the admin-reviewed employees
 *              by calling POST /users/import/confirm with the role assignments applied.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { postRequest } from '../../utils/apiService';
import {
  ConfirmImportPayload,
  ImportResult,
} from '../../types/importEmployees';

/**
 * Sends the confirmed employee list to the backend for upsert and hierarchy resolution.
 * @param payload Confirm DTO with employees and their admin-assigned role.
 * @returns Promise resolving to the import result summary.
 */
const confirmImport = async (
  payload: ConfirmImportPayload,
): Promise<ImportResult> => {
  return postRequest('/users/import/confirm', payload);
};

/**
 * Hook to confirm and persist the employee import. Invalidates the users cache on success.
 * @returns Mutation object exposing mutateAsync, isPending and error state.
 */
export const useConfirmImport = () => {
  const queryClient = useQueryClient();

  return useMutation<ImportResult, AxiosError, ConfirmImportPayload>({
    mutationFn: confirmImport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('Error confirming employee import:', error);
    },
  });
};
