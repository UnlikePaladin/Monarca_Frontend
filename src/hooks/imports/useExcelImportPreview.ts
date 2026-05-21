import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { postRequest } from '../../utils/apiService';

const previewImport = async <TPreview,>(
  endpoint: string,
  file: File,
): Promise<TPreview> => {
  const formData = new FormData();
  formData.append('file', file);
  return postRequest(endpoint, formData);
};

export const useExcelImportPreview = <TPreview,>(endpoint: string) =>
  useMutation<TPreview, AxiosError, File>({
    mutationFn: (file) => previewImport<TPreview>(endpoint, file),
    onError: (error) => {
      console.error(`Error al generar vista previa para ${endpoint}:`, error);
    },
  });
