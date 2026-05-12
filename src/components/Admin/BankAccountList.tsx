import { useState } from "react";

import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { toast } from "react-toastify";

import { Button } from "../ui/Button";
import FieldError from "../ui/FieldError";
import { useAuth } from "../../hooks/auth/authContext";
import { useGetCompany } from "../../hooks/companies/useGetCompany";
import { useGetCompanyBankAccounts } from "../../hooks/companies/useGetCompanyBankAccounts";
import { useDeleteCompanyBankAccount } from "../../hooks/companies/useDeleteCompanyBankAccount";


const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    if (error.response?.status === 403) {
      return "Solo CompanyAdmin puede gestionar cuentas bancarias de su propia empresa.";
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

function BankAccountsList() {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const [deletingBankAccountId, setDeletingBankAccountId] = useState<string | null>(
    null
  );

  const profileCompanyId = authState.userCompanyId ?? "";

  const {
    data: selectedCompany,
    isLoading: isLoadingCompany,
    error: companyError,
  } = useGetCompany(profileCompanyId);

  const {
    data: bankAccounts = [],
    isLoading: isLoadingBankAccounts,
    error: bankAccountsError,
  } = useGetCompanyBankAccounts(profileCompanyId);

  const {
    mutateAsync: deleteCompanyBankAccountMutation,
    isPending: isDeletingBankAccount,
  } = useDeleteCompanyBankAccount(profileCompanyId);

  const handleDeleteBankAccount = async (bankAccountId: string, name: string) => {
    if (!profileCompanyId) return;

    const confirmed = window.confirm(
      `¿Estas seguro de eliminar la cuenta bancaria ${name}?`
    );
    if (!confirmed) return;

    try {
      setDeletingBankAccountId(bankAccountId);
      await deleteCompanyBankAccountMutation(bankAccountId);
      toast.success("Cuenta bancaria eliminada correctamente", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      toast.error(getErrorMessage(error, "Error al eliminar la cuenta bancaria"), {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setDeletingBankAccountId(null);
    }
  };

  if (!profileCompanyId) {
    return (
      <section className="rounded-md">
        <div className="mx-auto max-w-5xl px-4 py-8 lg:py-16">
          <h2 className="text-xl font-bold text-gray-900">Cuentas bancarias</h2>
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
          <h2 className="text-xl font-bold text-gray-900">Cuentas bancarias</h2>
          <p className="text-sm text-gray-600">
            Como CompanyAdmin, solo puedes ver y gestionar cuentas bancarias para tu empresa.
          </p>
        </div>

        <div id="tenant_company" className="mb-6">
          <label
            htmlFor="bank-accounts-company"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Empresa
          </label>
          <div
            id="bank-accounts-company"
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

        <div id="tenant_bank_accounts" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Cuentas bancarias registradas</h3>
            <Button
              id="create_bank_account"
              type="button"
              onClick={() => navigate("/admin/bank-accounts/create")}
            >
              Crear cuenta bancaria
            </Button>
          </div>
          <div className="rounded-md bg-white p-4 shadow-lg">
            {isLoadingBankAccounts ? (
              <p className="text-sm text-gray-600">Cargando cuentas bancarias...</p>
            ) : bankAccounts.length === 0 ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">Aun no hay cuentas bancarias</p>
                <p className="text-sm text-gray-600">Crea la primera para empezar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md shadow-md">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">Nombre</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">País</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">Región</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">IBAN</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankAccounts.map((bankAccount) => (
                      <tr key={bankAccount.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm text-gray-900">{bankAccount.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{bankAccount.country}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{bankAccount.region}</td>
                        <td className="py-3 px-4 text-sm text-gray-700 font-mono">{bankAccount.iban}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteBankAccount(
                                bankAccount.id,
                                bankAccount.name
                              )
                            }
                            disabled={
                              isDeletingBankAccount &&
                              deletingBankAccountId === bankAccount.id
                            }
                            className="font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            {isDeletingBankAccount &&
                            deletingBankAccountId === bankAccount.id
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

            {!isLoadingBankAccounts && (
              <p className="mt-3 text-sm text-gray-600">Total actual: {bankAccounts.length}</p>
            )}

            <FieldError
              msg={
                bankAccountsError instanceof Error
                  ? bankAccountsError.message
                  : undefined
              }
            />
          </div>
        </div>       
      </div>
    </section>
  );
}

export default BankAccountsList;
