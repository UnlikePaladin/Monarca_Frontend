import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRequest } from "../../utils/apiService";
import { DeleteRefundPolicyResponse } from "../../types/refundPolicies";

const deleteRefundPolicy = async (
  policyId: string
): Promise<DeleteRefundPolicyResponse> => {
  const response = await deleteRequest(`/refund-policies/${policyId}`);
  return {
    status: Boolean((response as Record<string, unknown>)?.status),
    message: String((response as Record<string, unknown>)?.message ?? "Política eliminada"),
  };
};

export const useDeleteRefundPolicy = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteRefundPolicyResponse, Error, string>({
    mutationFn: deleteRefundPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refundPolicies"] });
    },
  });
};
