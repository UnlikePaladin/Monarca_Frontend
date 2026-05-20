import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { postRequest } from '../../utils/apiService';

const confirmImport = async <TPayload, TResult>(
  endpoint: string,
  payload: TPayload,
): Promise<TResult> => postRequest(endpoint, payload as Record<string, unknown>);

export const useExcelImportConfirm = <TPayload, TResult>(
  endpoint: string,
  queryKeys: QueryKey[] = [],
) => {
  const queryClient = useQueryClient();

  return useMutation<TResult, AxiosError, TPayload>({
    mutationFn: (payload) => confirmImport<TPayload, TResult>(endpoint, payload),
    onSuccess: () => {
      queryKeys.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
    onError: (error) => {
      console.error(`Error al confirmar importación para ${endpoint}:`, error);
    },
  });
};
