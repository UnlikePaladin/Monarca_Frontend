import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postRequest } from "../../utils/apiService";
import { CreateRefundPolicyPayload, RefundPolicy } from "../../types/refundPolicies";
import { normalizeRefundPolicyResponse } from "./refundPolicyMappers";

const createRefundPolicy = async (
  payload: CreateRefundPolicyPayload
): Promise<RefundPolicy> => {
  const response = await postRequest("/refund-policies", payload as Record<string, unknown>);
  const normalized = normalizeRefundPolicyResponse(response);

  if (!normalized) {
    throw new Error("No se pudo normalizar la política creada.");
  }

  return normalized;
};

export const useCreateRefundPolicy = () => {
  const queryClient = useQueryClient();

  return useMutation<RefundPolicy, Error, CreateRefundPolicyPayload>({
    mutationFn: createRefundPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refundPolicies"] });
    },
  });
};
