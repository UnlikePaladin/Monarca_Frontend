import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteRequest } from "../../utils/apiService";

const deleteCompanyBankAccount = async (
  companyId: string,
  bankAccountId: string
): Promise<void> => {
  await deleteRequest(`/companies/${companyId}/bank-accounts/${bankAccountId}`);
};

export const useDeleteCompanyBankAccount = (companyId?: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (bankAccountId) =>
      deleteCompanyBankAccount(companyId as string, bankAccountId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["companyBankAccounts", companyId],
      });
    },
  });
};

export { deleteCompanyBankAccount };
