import { useQuery } from "@tanstack/react-query";
import { getRequest } from "../../utils/apiService";
import { RefundPoliciesByCompany } from "../../types/refundPolicies";
import { normalizeRefundPoliciesByCompany } from "./refundPolicyMappers";

const fetchRefundPolicies = async (): Promise<RefundPoliciesByCompany[]> => {
  const response = await getRequest("/refund-policies");
  return normalizeRefundPoliciesByCompany(response);
};

export const useGetRefundPolicies = () => {
  return useQuery<RefundPoliciesByCompany[]>({
    queryKey: ["refundPolicies"],
    queryFn: fetchRefundPolicies,
  });
};
