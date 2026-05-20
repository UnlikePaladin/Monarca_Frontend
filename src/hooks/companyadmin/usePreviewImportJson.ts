/**
 * File: usePreviewImportJson.ts
 * Description: React Query mutation hook that sends a JSON employee payload to
 *              POST /users/import/preview-json and returns the same preview shape
 *              used by the Excel import flow.
 */

import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { postRequest } from '../../utils/apiService';
import {
  ImportJsonPayload,
  PreviewResponse,
} from '../../types/importEmployees';

/**
 * Sends the parsed JSON payload to the JSON preview endpoint.
 * @param payload JSON object with the `employees` array (Excel-compatible fields).
 * @returns Promise resolving to the backend preview response.
 */
const previewImportJson = async (
  payload: ImportJsonPayload,
): Promise<PreviewResponse> => {
  return postRequest('/users/import/preview-json', payload);
};

/**
 * Hook to trigger the JSON employee import preview request.
 * @returns Mutation object exposing mutateAsync, isPending and error state.
 */
export const usePreviewImportJson = () => {
  return useMutation<PreviewResponse, AxiosError, ImportJsonPayload>({
    mutationFn: previewImportJson,
    onError: (error) => {
      console.error('Error previewing employee JSON import:', error);
    },
  });
};
