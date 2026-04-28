import { useMutation, useQueryClient } from "@tanstack/react-query";

import { patchRequest } from "../../utils/apiService";

type UpdateDepartmentCostCenterPayload = {
  cost_center_id: number;
};

const updateCompanyDepartmentCostCenter = async (
  companyId: string,
  departmentId: string,
  payload: UpdateDepartmentCostCenterPayload
): Promise<void> => {
  await patchRequest(
    `/companies/${companyId}/departments/${departmentId}/cost-center`,
    payload
  );
};

export const useUpdateCompanyDepartmentCostCenter = (companyId?: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { departmentId: string; cost_center_id: number }>({
    mutationFn: ({ departmentId, cost_center_id }) =>
      updateCompanyDepartmentCostCenter(companyId as string, departmentId, {
        cost_center_id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["companyDepartments", companyId],
      });
    },
  });
};

export { updateCompanyDepartmentCostCenter };