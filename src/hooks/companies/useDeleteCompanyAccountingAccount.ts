import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteRequest } from "../../utils/apiService";

const deleteCompanyAccountingAccount = async (
  companyId: string,
  accountingAccountId: string
): Promise<void> => {
  await deleteRequest(`/companies/${companyId}/accounting-accounts/${accountingAccountId}`);
};

export const useDeleteCompanyAccountingAccount = (companyId?: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (accountingAccountId) =>
      deleteCompanyAccountingAccount(companyId as string, accountingAccountId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["companyAccountingAccounts", companyId],
      });
    },
  });
};

export { deleteCompanyAccountingAccount };
