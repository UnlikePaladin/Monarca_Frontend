import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "react-toastify";

import { Button } from "../ui/Button";
import FieldError from "../ui/FieldError";
import { Input } from "../ui/Input";
import Select from "../ui/Select";
import { useAuth } from "../../hooks/auth/authContext";
import { useGetCompany } from "../../hooks/companies/useGetCompany";
import { useCreateCompanyBankAccount } from "../../hooks/companies/useCreateCompanyBankAccount";
import { CreateBankAccountPayload } from "../../types/bankAccount";
import { useNavigate } from "react-router-dom";

// IBAN validation: alphanumeric, 15-34 chars
const ibanSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9]+$/, { message: "IBAN debe ser alfanumérico" })
  .min(15, { message: "IBAN debe tener al menos 15 caracteres" })
  .max(34, { message: "IBAN no debe exceder 34 caracteres" });

const bankAccountSchema = z.object({
  name: z.string().trim().min(1, {
    message: "Escriba el nombre de la cuenta bancaria",
  }),
  country: z.string().trim().min(1, {
    message: "Escriba el país",
  }),
  region: z.string().trim().min(1, {
    message: "Escriba la región",
  }),
  iban: ibanSchema,
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

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

function CreateBankAccountForm() {
  const { authState } = useAuth();
  const navigate = useNavigate();

  const profileCompanyId = authState.userCompanyId ?? "";

  const {
    data: selectedCompany,
    isLoading: isLoadingCompany,
    error: companyError,
  } = useGetCompany(profileCompanyId);

  const {
    mutateAsync: createCompanyBankAccountMutation,
    isPending: isCreatingBankAccount,
  } = useCreateCompanyBankAccount(profileCompanyId);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      name: "",
      country: "",
      region: "",
      iban: "",
    },
  });

  const countryOptions = [
    { id: "mx", name: "Mexico" },
    { id: "us", name: "United States" },
    { id: "ca", name: "Canada" },
    { id: "ar", name: "Argentina" },
    { id: "br", name: "Brazil" },
    { id: "cl", name: "Chile" },
    { id: "co", name: "Colombia" },
    { id: "pe", name: "Peru" },
    { id: "uy", name: "Uruguay" },
    { id: "ve", name: "Venezuela" },
    { id: "es", name: "Spain" },
    { id: "fr", name: "France" },
    { id: "de", name: "Germany" },
    { id: "it", name: "Italy" },
    { id: "pt", name: "Portugal" },
    { id: "nl", name: "Netherlands" },
  ];

  const regionsByCountry: Record<string, { id: string; name: string }[]> = {
    mx: [
      { id: "cdmx", name: "Ciudad de México" },
      { id: "jal", name: "Jalisco" },
      { id: "nle", name: "Nuevo León" },
      { id: "pue", name: "Puebla" },
      { id: "yuc", name: "Yucatán" },
    ],
    us: [
      { id: "ca", name: "California" },
      { id: "ny", name: "New York" },
      { id: "tx", name: "Texas" },
      { id: "fl", name: "Florida" },
      { id: "il", name: "Illinois" },
    ],
    ca: [
      { id: "on", name: "Ontario" },
      { id: "qc", name: "Quebec" },
      { id: "bc", name: "British Columbia" },
      { id: "ab", name: "Alberta" },
    ],
    ar: [
      { id: "bue", name: "Buenos Aires" },
      { id: "cor", name: "Córdoba" },
      { id: "sfe", name: "Santa Fe" },
    ],
    br: [
      { id: "sp", name: "São Paulo" },
      { id: "rj", name: "Rio de Janeiro" },
      { id: "mg", name: "Minas Gerais" },
    ],
    cl: [
      { id: "stg", name: "Santiago" },
      { id: "vla", name: "Valparaíso" },
    ],
    co: [
      { id: "bog", name: "Bogotá" },
      { id: "ant", name: "Antioquia" },
    ],
    pe: [
      { id: "lma", name: "Lima" },
      { id: "are", name: "Arequipa" },
    ],
    uy: [
      { id: "mvd", name: "Montevideo" },
    ],
    ve: [
      { id: "ccs", name: "Caracas" },
    ],
    es: [
      { id: "md", name: "Madrid" },
      { id: "ct", name: "Catalonia" },
    ],
    fr: [
      { id: "idfr", name: "Île-de-France" },
      { id: "oc", name: "Occitanie" },
    ],
    de: [
      { id: "bw", name: "Baden-Württemberg" },
      { id: "by", name: "Bavaria" },
    ],
    it: [
      { id: "rm", name: "Lazio (Rome)" },
      { id: "lb", name: "Lombardy" },
    ],
    pt: [
      { id: "lis", name: "Lisbon" },
    ],
    nl: [
      { id: "nh", name: "North Holland" },
    ],
  };

  const watchedCountry = watch("country");
  const onSubmit = async (data: BankAccountFormValues) => {
    if (!profileCompanyId) {
      toast.error("Tu usuario no tiene una empresa asignada", {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    const countryName = countryOptions.find((c) => c.id === data.country)?.name ?? data.country;
    const regionName = (regionsByCountry[data.country] || []).find((r) => r.id === data.region)?.name ?? data.region;

    const payload: CreateBankAccountPayload = {
      name: data.name.trim(),
      country: String(countryName).trim(),
      region: String(regionName).trim(),
      iban: data.iban.trim().toUpperCase(),
    };

    try {
      await createCompanyBankAccountMutation(payload);
      toast.success("Cuenta bancaria creada correctamente", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });

      reset({
        name: "",
        country: "",
        region: "",
        iban: "",
      });
    } catch (error) {
      toast.error(getErrorMessage(error, "Error al crear la cuenta bancaria"), {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
    navigate("/admin/bank-accounts")
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
            Como CompanyAdmin, solo puedes gestionar cuentas bancarias para tu empresa.
          </p>
        </div>

        <div id="tenant_company" className="mb-6">
          <label
            htmlFor="bank-accounts-company"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Empresa
          </label>
          <div id="bank-accounts-company" className="text-sm text-gray-700">
            {isLoadingCompany ? (
              <span>Cargando empresa...</span>
            ) : selectedCompany ? (
              <span>{`${selectedCompany.name} (${selectedCompany.key})`}</span>
            ) : (
              <span>Empresa no disponible</span>
            )}
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
            <h3 className="text-lg font-semibold text-gray-900">Nueva cuenta bancaria</h3>

            <div>
              <label
                htmlFor="bank-account-name"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Nombre
              </label>
              <Input id="bank-account-name" {...register("name")} />
              <FieldError msg={errors.name?.message} />
            </div>

            <div>
              <label
                htmlFor="bank-account-country"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                País
              </label>
              <Controller
                control={control}
                name="country"
                render={({ field }) => {
                  const selected = countryOptions.find((o) => o.id === field.value) || null;
                  return (
                    <>
                      <Select
                        id="bank-account-country"
                        options={countryOptions}
                        value={selected}
                        onChange={(opt) => {
                          field.onChange(opt.id);
                          setValue("region", "");
                        }}
                        placeholder="Selecciona un país"
                      />
                      <FieldError msg={errors.country?.message} />
                    </>
                  );
                }}
              />
            </div>

            <div>
              <label
                htmlFor="bank-account-region"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Región
              </label>
              <Controller
                control={control}
                name="region"
                render={({ field }) => {
                  const regionOptions = watchedCountry ? regionsByCountry[watchedCountry] || [] : [];
                  const selected = regionOptions.find((o) => o.id === field.value) || null;
                  return (
                    <>
                      <Select
                        id="bank-account-region"
                        options={regionOptions}
                        value={selected}
                        onChange={(opt) => field.onChange(opt.id)}
                        placeholder={watchedCountry ? "Selecciona una región" : "Selecciona país primero"}
                        isDisabled={!watchedCountry}
                      />
                      <FieldError msg={errors.region?.message} />
                    </>
                  );
                }}
              />
            </div>

            <div>
              <label
                htmlFor="bank-account-iban"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                IBAN
              </label>
              <Input
                id="bank-account-iban"
                {...register("iban")}
                placeholder="Ej: GB82WEST12345698765432"
              />
              <FieldError msg={errors.iban?.message} />
            </div>
          </div>

          <div className="flex justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                id="create_bank_account"
                type="submit"
                disabled={
                  isCreatingBankAccount ||
                  isSubmitting ||
                  isLoadingCompany ||
                  !selectedCompany
                }
              >
                {isCreatingBankAccount || isSubmitting
                  ? "Guardando..."
                  : "Crear cuenta bancaria"}
              </Button>
              <Button
                type="button"
                onClick={() =>
                  reset({
                    name: "",
                    country: "",
                    region: "",
                    iban: "",
                  })
                }
              >
                Limpiar formulario
              </Button>
            </div>
            <Button
              type="button"
              onClick={() =>
                navigate("/admin/bank-accounts")
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

export default CreateBankAccountForm;
