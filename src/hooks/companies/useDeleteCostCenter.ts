import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteRequest } from "../../utils/apiService";

const deleteCostCenter = async (costCenterId: string): Promise<void> => {
  await deleteRequest(`/cost-centers/${costCenterId}`);
};

export const useDeleteCostCenter = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteCostCenter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costCenters"] });
    },
  });
};

export { deleteCostCenter };