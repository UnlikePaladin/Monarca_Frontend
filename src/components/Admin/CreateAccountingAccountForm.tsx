// no top-level state required

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "react-toastify";

import { Button } from "../ui/Button";
import FieldError from "../ui/FieldError";
import { Input } from "../ui/Input";
import Select from "../ui/Select";
import Switch from "../ui/Switch";
import { useAuth } from "../../hooks/auth/authContext";
import { useGetCompany } from "../../hooks/companies/useGetCompany";
import { useCreateCompanyAccountingAccount } from "../../hooks/companies/useCreateCompanyAccountingAccount";
import { useGetCompanyBankAccounts } from "../../hooks/companies/useGetCompanyBankAccounts";
import { CreateAccountingAccountPayload } from "../../types/accountingAccount";
import { useNavigate } from "react-router-dom";

const accountingAccountSchema = z.object({
  key: z.string().trim().min(1, {
    message: "Escriba la clave de la cuenta contable",
  }),
  description: z.string().trim().min(1, {
    message: "Escriba la descripcion de la cuenta contable",
  }),
  requiresCostCenter: z.boolean(),
  bankAccountId: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().uuid().optional()
  ),
});


type AccountingAccountFormValues = z.infer<typeof accountingAccountSchema>;

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

function CreateAccountingAccountForm() {
  const { authState } = useAuth();
  const navigate = useNavigate();

  const profileCompanyId = authState.userCompanyId ?? "";

  const {
    data: selectedCompany,
    isLoading: isLoadingCompany,
    error: companyError,
  } = useGetCompany(profileCompanyId);

  const {
    mutateAsync: createCompanyAccountingAccountMutation,
    isPending: isCreatingAccountingAccount,
  } = useCreateCompanyAccountingAccount(profileCompanyId);

  const {
    data: companyBankAccounts = [],
    isLoading: isLoadingBankAccounts,
    error: bankAccountsError,
  } = useGetCompanyBankAccounts(profileCompanyId);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<AccountingAccountFormValues>({
    resolver: zodResolver(accountingAccountSchema),
    defaultValues: {
      key: "",
      description: "",
      requiresCostCenter: false,
      bankAccountId: "",
    },
  });

  const onSubmit = async (data: AccountingAccountFormValues) => {
    if (!profileCompanyId) {
      toast.error("Tu usuario no tiene una empresa asignada", {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    const payload: CreateAccountingAccountPayload = {
      key: data.key.trim(),
      description: data.description.trim(),
      requiresCostCenter: data.requiresCostCenter,
      bankAccountId: data.bankAccountId?.trim() || undefined,
    };

    try {
      await createCompanyAccountingAccountMutation(payload);
      toast.success("Cuenta contable creada correctamente", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });

      reset({
        key: "",
        description: "",
        requiresCostCenter: false,
      });
    } catch (error) {
        // Map backend validation errors to form fields when possible
        if (error instanceof AxiosError && error.response?.data) {
          const data = error.response.data as Record<string, any>;
          const errorsObj = data.errors ?? data;
          if (typeof errorsObj === "object") {
            for (const [key, val] of Object.entries(errorsObj)) {
              const fieldName = key === "bank_account_id" ? "bankAccountId" : key;
              const message = Array.isArray(val) ? String(val[0]) : String((val as any).message ?? val);
              try {
                setError(fieldName as any, { type: "server", message });
              } catch (e) {
                // ignore setError failures
              }
            }
            return;
          }
        }

        toast.error(getErrorMessage(error, "Error al crear la cuenta contable"), {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
    }
    navigate("/admin/accounting-accounts")
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
            Como CompanyAdmin, solo puedes gestionar cuentas contables para tu empresa.
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

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Nueva cuenta contable</h3>

            <div>
              <label
                htmlFor="accounting-account-key"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Clave
              </label>
              <Input id="accounting-account-key" {...register("key")} />
              <FieldError msg={errors.key?.message} />
            </div>

            <div>
              <label
                htmlFor="accounting-account-description"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Descripcion
              </label>
              <Input id="accounting-account-description" {...register("description")} />
              <FieldError msg={errors.description?.message} />
            </div>

            <div>
              <label
                htmlFor="accounting-account-bank"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Cuenta bancaria vinculada
              </label>
              <Controller
                control={control}
                name="bankAccountId"
                render={({ field }) => {
                  const selected = companyBankAccounts.find((b) => b.id === field.value) || null;
                  return (
                    <>
                          {
                            // Include an explicit 'none' option so the user can clear the bank account
                          }
                          <Select
                            id="accounting-account-bank"
                            options={[
                              { id: "", name: "Ninguna" },
                              ...companyBankAccounts.map((b) => ({ id: b.id, name: `${b.name} · ${b.iban}` })),
                            ]}
                            value={selected ? { id: selected.id, name: `${selected.name} · ${selected.iban}` } : (field.value === "" ? { id: "", name: "Ninguna" } : null)}
                            onChange={(opt) => field.onChange(opt ? opt.id : "")}
                            placeholder={isLoadingBankAccounts ? "Cargando cuentas..." : "Selecciona una cuenta bancaria (opcional)"}
                            isDisabled={!profileCompanyId || isLoadingBankAccounts}
                          />
                      <FieldError msg={bankAccountsError instanceof Error ? bankAccountsError.message : undefined} />
                    </>
                  );
                }}
              />
            </div>

            <div>
              <label
                htmlFor="accounting-account-requires-cost-center"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Requiere centro de costos
              </label>
              <Controller
                control={control}
                name="requiresCostCenter"
                render={({ field }) => (
                  <Switch
                    id="accounting-account-requires-cost-center"
                    checked={Boolean(field.value)}
                    onChange={field.onChange}
                    srLabel="Requiere centro de costos"
                  />
                )}
              />
            </div>
          </div>

          <div className="flex justify-between">            
            <div className="flex flex-wrap items-center gap-3">
              <Button
                id="create_accounting_account"
                type="submit"
                disabled={
                  isCreatingAccountingAccount ||
                  isSubmitting ||
                  isLoadingCompany ||
                  !selectedCompany
                }
              >
                {isCreatingAccountingAccount || isSubmitting
                  ? "Guardando..."
                  : "Crear cuenta contable"}
              </Button>
              <Button
                type="button"
                onClick={() =>
                  reset({
                    key: "",
                    description: "",
                    requiresCostCenter: false,
                  })
                }
              >
                Limpiar formulario
              </Button>
            </div>
              <Button
              type="button"
              onClick={() =>
                navigate("/admin/accounting-accounts")
              }
              >
                Cancelar
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default CreateAccountingAccountForm;
