/**
 * File: usePreviewImport.ts
 * Description: React Query mutation hook that uploads the employees Excel file to
 *              POST /users/import/preview and returns the parsed preview payload.
 */

import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { postRequest } from '../../utils/apiService';
import { PreviewResponse } from '../../types/importEmployees';

/**
 * Sends the selected .xlsx/.xls file as multipart form data to the preview endpoint.
 * @param file Excel file chosen by the admin.
 * @returns Promise resolving to the backend preview response.
 */
const previewImport = async (file: File): Promise<PreviewResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  return postRequest('/users/import/preview', formData);
};

/**
 * Hook to trigger the employee import preview request.
 * @returns Mutation object exposing mutateAsync, isPending and error state.
 */
export const usePreviewImport = () => {
  return useMutation<PreviewResponse, AxiosError, File>({
    mutationFn: previewImport,
    onError: (error) => {
      console.error('Error previewing employee import:', error);
    },
  });
};
