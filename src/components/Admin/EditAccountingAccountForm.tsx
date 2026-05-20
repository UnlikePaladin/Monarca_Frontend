import { useEffect } from "react";
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
import { usePatchCompanyAccountingAccount } from "../../hooks/companies/usePatchCompanyAccountingAccount";
import { useGetCompanyBankAccounts } from "../../hooks/companies/useGetCompanyBankAccounts";
import { CreateAccountingAccountPayload } from "../../types/accountingAccount";
import { AccountingAccount } from "../../types/accountingAccount";
import { useNavigate } from "react-router-dom";

const accountingAccountSchema = z.object({
  key: z.string().trim().min(1, { message: "Escriba la clave de la cuenta contable" }),
  description: z.string().trim().min(1, { message: "Escriba la descripción de la cuenta contable" }),
  requiresCostCenter: z.boolean(),
  bankAccountId: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().uuid().optional()
  ),
});

type Props = {
  accountingAccountId: string;
  initialData: AccountingAccount;
};

type FormValues = z.infer<typeof accountingAccountSchema>;

const mapBackendValidationToForm = (error: AxiosError | unknown, setError: (name: any, error: any) => void) => {
  if (!(error instanceof AxiosError) || !error.response) return false;
  const data = error.response.data as Record<string, any> | undefined;
  if (!data) return false;

  // Common shapes: { errors: { field: [msg] } } or { errors: { field: msg } } or { field: [msg] }
  const errors = data.errors ?? data;
  if (typeof errors !== "object") return false;

  for (const [key, val] of Object.entries(errors)) {
    const fieldName = key === "bank_account_id" ? "bankAccountId" : key;
    const message = Array.isArray(val) ? String(val[0]) : String((val as any).message ?? val);
    setError(fieldName, { type: "server", message });
  }
  return true;
};

function EditAccountingAccountForm({ accountingAccountId, initialData }: Props) {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const profileCompanyId = authState.userCompanyId ?? "";

  const {
    data: selectedCompany,
    isLoading: isLoadingCompany,
    error: companyError,
  } = useGetCompany(profileCompanyId);

  const { data: companyBankAccounts = [] } = useGetCompanyBankAccounts(profileCompanyId);

  const { mutateAsync: patchAccountingAccount, isPending: isPatching } = usePatchCompanyAccountingAccount(profileCompanyId);

  const { control, register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(accountingAccountSchema),
    defaultValues: {
      key: initialData.key ?? "",
      description: initialData.description ?? "",
      requiresCostCenter: Boolean(initialData.requiresCostCenter),
      bankAccountId: initialData.bankAccountId ?? "",
    },
  });

  useEffect(() => {
    // reset when initialData changes
    reset({
      key: initialData.key ?? "",
      description: initialData.description ?? "",
      requiresCostCenter: Boolean(initialData.requiresCostCenter),
      bankAccountId: initialData.bankAccountId ?? "",
    });
  }, [initialData, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!profileCompanyId) {
      toast.error("Tu usuario no tiene una empresa asignada", { position: "top-right", autoClose: 4000 });
      return;
    }

    const payload: CreateAccountingAccountPayload = {
      key: data.key.trim(),
      description: data.description.trim(),
      requiresCostCenter: data.requiresCostCenter,
      bankAccountId: data.bankAccountId?.trim() || undefined,
    };

    try {
      await patchAccountingAccount({ accountingAccountId, payload });
      toast.success("Cuenta contable actualizada", { position: "top-right", autoClose: 3000 });
      navigate("/admin/accounting-accounts");
    } catch (error) {
      const handled = mapBackendValidationToForm(error, setError as any);
      if (!handled) {
        if (error instanceof AxiosError && error.response?.status === 403) {
          toast.error("Solo CompanyAdmin puede gestionar cuentas contables de su propia empresa.", { position: "top-right" });
        } else if (!((error as AxiosError).response)) {
          toast.error("No se pudo conectar con el servidor. Verifique su conexion e intente de nuevo.", { position: "top-right" });
        } else {
          toast.error("Error al actualizar la cuenta contable", { position: "top-right" });
        }
      }
    }
  };

  return (
    <section className="rounded-md">
      <div className="mx-auto max-w-5xl px-4 py-8 lg:py-16">
        <div className="mb-6 space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Editar cuenta contable</h2>
        </div>

        <div id="tenant_company" className="mb-6">
          <label htmlFor="accounting-accounts-company" className="mb-2 block text-sm font-medium text-gray-900">Empresa</label>
          <div id="accounting-accounts-company" className="rounded-md bg-white px-3 py-2.5 text-sm text-gray-900 ring-1 ring-inset ring-gray-300">
            {isLoadingCompany ? "Cargando empresa..." : selectedCompany ? `${selectedCompany.name} (${selectedCompany.key})` : "Empresa no disponible"}
          </div>
          <FieldError msg={companyError instanceof Error ? companyError.message : undefined} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="accounting-account-key" className="mb-2 block text-sm font-medium text-gray-900">Clave</label>
              <Input id="accounting-account-key" {...register("key")} />
              <FieldError msg={errors.key?.message} />
            </div>

            <div>
              <label htmlFor="accounting-account-description" className="mb-2 block text-sm font-medium text-gray-900">Descripción</label>
              <Input id="accounting-account-description" {...register("description")} />
              <FieldError msg={errors.description?.message} />
            </div>

            <div>
              <label htmlFor="accounting-account-requires-cost-center" className="mb-2 block text-sm font-medium text-gray-900">Requiere centro de costos</label>
              <Controller control={control} name="requiresCostCenter" render={({ field }) => (
                <Switch id="accounting-account-requires-cost-center" checked={Boolean(field.value)} onChange={field.onChange} srLabel="Requiere centro de costos" />
              )} />
            </div>

            <div>
              <label htmlFor="accounting-account-bank" className="mb-2 block text-sm font-medium text-gray-900">Cuenta bancaria vinculada</label>
              <Controller control={control} name="bankAccountId" render={({ field }) => {
                const selected = companyBankAccounts.find((b) => b.id === field.value) || null;
                return (
                  <>
                    {/* Explicit 'Ninguna' option to allow clearing the bank account */}
                    <Select
                      id="accounting-account-bank"
                      options={[
                        { id: "", name: "Ninguna" },
                        ...companyBankAccounts.map((b) => ({ id: b.id, name: `${b.name} · ${b.iban}` })),
                      ]}
                      value={selected ? { id: selected.id, name: `${selected.name} · ${selected.iban}` } : (field.value === "" ? { id: "", name: "Ninguna" } : null)}
                      onChange={(opt) => field.onChange(opt ? opt.id : "")}
                      placeholder={companyBankAccounts.length === 0 ? "No hay cuentas" : "Selecciona una cuenta bancaria (opcional)"}
                    />
                    <FieldError msg={errors.bankAccountId?.message} />
                  </>
                );
              }} />
            </div>
          </div>

          <div className="flex justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Button id="patch_accounting_account" type="submit" disabled={isPatching || isSubmitting || isLoadingCompany}>
                {isPatching || isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
              <Button type="button" onClick={() => reset()}>
                Reset
              </Button>
            </div>
            <Button type="button" onClick={() => navigate("/admin/accounting-accounts")}>Cancelar</Button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default EditAccountingAccountForm;
