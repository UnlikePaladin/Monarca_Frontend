import { useMutation, useQueryClient } from "@tanstack/react-query";

import { patchRequest } from "../../utils/apiService";
import { AccountingAccount, CreateAccountingAccountPayload } from "../../types/accountingAccount";

const patchCompanyAccountingAccount = async (
  companyId: string,
  accountingAccountId: string,
  payload: CreateAccountingAccountPayload
): Promise<AccountingAccount> => {
  const requestPayload = {
    key: payload.key,
    description: payload.description,
    requiresCostCenter: payload.requiresCostCenter,
    ...(payload.bankAccountId ? { idBankAccount: payload.bankAccountId } : {}),
  };

  const response = await patchRequest(`/companies/${companyId}/accounting-accounts/${accountingAccountId}`, requestPayload);
  const raw = (response as Record<string, unknown>)?.accountingAccount ?? (response as Record<string, unknown>)?.accounting_account ?? (response as Record<string, unknown>)?.data ?? response;

  // Best-effort parse
  const id = String((raw as Record<string, unknown>)?.id ?? accountingAccountId).trim();
  return {
    id,
    key: String((raw as Record<string, unknown>)?.key ?? payload.key).trim(),
    description: String((raw as Record<string, unknown>)?.description ?? payload.description).trim(),
    requiresCostCenter: Boolean(payload.requiresCostCenter),
    bankAccountId: payload.bankAccountId,
  } as AccountingAccount;
};

export const usePatchCompanyAccountingAccount = (companyId?: string) => {
  const queryClient = useQueryClient();

  return useMutation<AccountingAccount, Error, { accountingAccountId: string; payload: CreateAccountingAccountPayload }>({
    mutationFn: ({ accountingAccountId, payload }) => patchCompanyAccountingAccount(companyId as string, accountingAccountId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["companyAccountingAccounts", companyId] });
      queryClient.invalidateQueries({ queryKey: ["companyAccountingAccount", companyId, variables.accountingAccountId] });
    },
  });
};

export { patchCompanyAccountingAccount };
