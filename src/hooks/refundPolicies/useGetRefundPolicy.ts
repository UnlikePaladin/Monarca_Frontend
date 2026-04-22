import { useQuery } from "@tanstack/react-query";
import { getRequest } from "../../utils/apiService";
import { RefundPolicy } from "../../types/refundPolicies";
import { normalizeRefundPolicyResponse } from "./refundPolicyMappers";

const fetchRefundPolicy = async (policyId: string): Promise<RefundPolicy> => {
  const response = await getRequest(`/refund-policies/${policyId}`);
  const normalized = normalizeRefundPolicyResponse(response);

  if (!normalized) {
    throw new Error("No se pudo normalizar la política seleccionada.");
  }

  return normalized;
};

export const useGetRefundPolicy = (policyId?: string) => {
  return useQuery<RefundPolicy>({
    queryKey: ["refundPolicies", "detail", policyId],
    queryFn: () => fetchRefundPolicy(policyId as string),
    enabled: Boolean(policyId),
  });
};
