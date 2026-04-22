import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchRequest } from "../../utils/apiService";
import { RefundPolicy, UpdateRefundPolicyPayload } from "../../types/refundPolicies";
import { normalizeRefundPolicyResponse } from "./refundPolicyMappers";

type UpdatePolicyInput = {
  policyId: string;
  data: UpdateRefundPolicyPayload;
};

const updateRefundPolicy = async ({
  policyId,
  data,
}: UpdatePolicyInput): Promise<RefundPolicy> => {
  const response = await patchRequest(
    `/refund-policies/${policyId}`,
    data as Record<string, unknown>
  );
  const normalized = normalizeRefundPolicyResponse(response);

  if (!normalized) {
    throw new Error("No se pudo normalizar la política actualizada.");
  }

  return normalized;
};

export const useUpdateRefundPolicy = () => {
  const queryClient = useQueryClient();

  return useMutation<RefundPolicy, Error, UpdatePolicyInput>({
    mutationFn: updateRefundPolicy,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["refundPolicies"] });
      queryClient.invalidateQueries({ queryKey: ["refundPolicies", "detail", variables.policyId] });
    },
  });
};
