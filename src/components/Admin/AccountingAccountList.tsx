import { useState } from "react";

import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { toast } from "react-toastify";

import { Button } from "../ui/Button";
import FieldError from "../ui/FieldError";
import { useAuth } from "../../hooks/auth/authContext";
import { useGetCompany } from "../../hooks/companies/useGetCompany";
import { useGetCompanyAccountingAccounts } from "../../hooks/companies/useGetCompanyAccountingAccounts";
import { useDeleteCompanyAccountingAccount } from "../../hooks/companies/useDeleteCompanyAccountingAccount";


const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    if (error.response?.status === 403) {
      return "Solo CompanyAdmin puede gestionar cuentas contables de su propia empresa.";
    }

    if (error.response?.data) {
      const responseData = error.response.data as { message?: unknown };
      if (typeof responseData.message === "string" && responseData.message) {
        return responseData.message;
      }
    }

    if (!error.response) {
      return "No se pudo conectar con el servidor. Verifique su conexion e intente de nuevo.";
    }
  }

  return fallback;
};

function AccountingAccountsList() {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const [deletingAccountingAccountId, setDeletingAccountingAccountId] = useState<string | null>(
    null
  );

  const profileCompanyId = authState.userCompanyId ?? "";

  const {
    data: selectedCompany,
    isLoading: isLoadingCompany,
    error: companyError,
  } = useGetCompany(profileCompanyId);

  const {
    data: accountingAccounts = [],
    isLoading: isLoadingAccountingAccounts,
    error: accountingAccountsError,
  } = useGetCompanyAccountingAccounts(profileCompanyId);

  const {
    mutateAsync: deleteCompanyAccountingAccountMutation,
    isPending: isDeletingAccountingAccount,
  } = useDeleteCompanyAccountingAccount(profileCompanyId);

  const handleDeleteAccountingAccount = async (accountingAccountId: string, key: string) => {
    if (!profileCompanyId) return;

    const confirmed = window.confirm(
      `¿Estas seguro de eliminar la cuenta contable ${key}?`
    );
    if (!confirmed) return;

    try {
      setDeletingAccountingAccountId(accountingAccountId);
      await deleteCompanyAccountingAccountMutation(accountingAccountId);
      toast.success("Cuenta contable eliminada correctamente", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      toast.error(getErrorMessage(error, "Error al eliminar la cuenta contable"), {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setDeletingAccountingAccountId(null);
    }
  };

  if (!profileCompanyId) {
    return (
      <section className="rounded-md">
        <div className="mx-auto max-w-5xl px-4 py-8 lg:py-16">
          <h2 className="text-xl font-bold text-gray-900">Cuentas contables</h2>
          <p className="mt-2 text-sm text-red-600">
            No se pudo resolver tu empresa desde el departamento del perfil.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-md">
      <div className="mx-auto max-w-5xl px-4 py-8 lg:py-16">
        <div className="mb-6 space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Cuentas contables</h2>
          <p className="text-sm text-gray-600">
            Como CompanyAdmin, solo puedes ver y gestionar cuentas contables para tu empresa.
          </p>
        </div>

        <div id="tenant_company" className="mb-6">
          <label
            htmlFor="accounting-accounts-company"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Empresa
          </label>
          <div
            id="accounting-accounts-company"
            className="rounded-md bg-white px-3 py-2.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-300"
          >
            {isLoadingCompany
              ? "Cargando empresa..."
              : selectedCompany
                ? `${selectedCompany.name} (${selectedCompany.key})`
                : "Empresa no disponible"}
          </div>
          {selectedCompany && (
            <p className="mt-2 text-sm text-gray-600">
              Empresa activa: <strong>{selectedCompany.name}</strong>
            </p>
          )}
          <FieldError msg={companyError instanceof Error ? companyError.message : undefined} />
        </div>

        <div id="tenant_accounting_accounts" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Cuentas contables registradas</h3>
            <Button
              id="create_accounting_account"
              type="button"
              onClick={() => navigate("/admin/accounting-accounts/create")}
            >
              Crear cuenta contable
            </Button>
          </div>
          <div className="rounded-md bg-white p-4 shadow-lg">
            {isLoadingAccountingAccounts ? (
              <p className="text-sm text-gray-600">Cargando cuentas contables...</p>
            ) : accountingAccounts.length === 0 ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">Aun no hay cuentas contables</p>
                <p className="text-sm text-gray-600">Crea la primera para empezar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md shadow-md">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">Clave</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">Descripcion</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">Requiere centro de costos</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountingAccounts.map((accountingAccount) => (
                      <tr key={accountingAccount.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm text-gray-900">{accountingAccount.key}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{accountingAccount.description}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {accountingAccount.requiresCostCenter ? "Si" : "No"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteAccountingAccount(
                                accountingAccount.id,
                                accountingAccount.key
                              )
                            }
                            disabled={
                              isDeletingAccountingAccount &&
                              deletingAccountingAccountId === accountingAccount.id
                            }
                            className="font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            {isDeletingAccountingAccount &&
                            deletingAccountingAccountId === accountingAccount.id
                              ? "Eliminando..."
                              : "Eliminar"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!isLoadingAccountingAccounts && (
              <p className="mt-3 text-sm text-gray-600">Total actual: {accountingAccounts.length}</p>
            )}

            <FieldError
              msg={
                accountingAccountsError instanceof Error
                  ? accountingAccountsError.message
                  : undefined
              }
            />
          </div>
        </div>       
      </div>
    </section>
  );
}

export default AccountingAccountsList;
