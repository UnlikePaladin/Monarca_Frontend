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
import { useRegions } from "../../hooks/useRegions";

// Countries where IBAN is commonly used
const IBAN_COUNTRIES = new Set(["es", "fr", "de", "it", "pt", "nl", "gb", "se", "no", "fi", "dk", "be", "ch", "at", "ie", "lu", "mt", "gr"]);

const formatIdentifierForCountry = (country: string, value: string) => {
  const c = (country || "").toLowerCase();
  let v = String(value || "").trim();
  if (!v) return v;

  // If contains letters, prefer uppercase and remove spaces
  if (/[A-Za-z]/.test(v)) {
    v = v.replace(/\s+/g, "").toUpperCase();
  }

  if (c === "mx") {
    // CLABE (18 digits) or SWIFT
    const digits = v.replace(/\D/g, "");
    if (digits.length >= 18) return digits.slice(0, 18);
    return v.toUpperCase();
  }

  if (c === "us") {
    // US routing number (9 digits) or SWIFT
    const digits = v.replace(/\D/g, "");
    if (digits.length >= 9) return digits.slice(0, 9);
    return v.toUpperCase();
  }

  if (c === "ca") {
    // Canadian transit+institution as 9 digits
    const digits = v.replace(/\D/g, "");
    if (digits.length >= 9) return digits.slice(0, 9);
    return v.toUpperCase();
  }

  if (c === "au" || c === "nz") {
    // BSB 6 digits
    const digits = v.replace(/\D/g, "");
    if (digits.length >= 6) return digits.slice(0, 6);
    return v.toUpperCase();
  }

  if (IBAN_COUNTRIES.has(c)) {
    return v.replace(/\s+/g, "").toUpperCase();
  }

  // Fallback: remove excessive spaces and uppercase
  return v.replace(/\s+/g, "").toUpperCase();
};

// Account identifier validation will be performed conditionally in superRefine
const basicId = z.string().trim().min(1, { message: "Escriba el identificador de la cuenta" });

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
  regionOther: z.string().optional(),
  iban: basicId,
});

// Cross-field validation: validate `iban` according to `country` meaning accept
// IBAN where appropriate, SWIFT/BIC, CLABE (MX), Canadian transit (CA), BSB (AU/NZ), or US routing
bankAccountSchema.superRefine((obj, ctx) => {
  const country = (obj.country || "").toLowerCase();
  const id = (obj.iban || "").trim();

  const isIban = /^[A-Za-z0-9]{15,34}$/.test(id);
  const isSwift = /^[A-Za-z]{6}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?$/.test(id); // 8 or 11
  const isClabe = /^\d{18}$/.test(id); // Mexico
  const isUsRouting = /^\d{9}$/.test(id); // US ABA routing
  const isCaTransit = /^\d{9}$/.test(id); // CA transit+institution as 9 digits
  const isBsb = /^\d{6}$/.test(id); // AU/NZ BSB

  const allowIbanCountries = new Set(["es", "fr", "de", "it", "pt", "nl", "gb", "se", "no", "fi", "dk", "be", "ch", "at", "ie", "lu", "mt", "gr"]);

  let valid = false;

  if (country === "mx") {
    valid = isClabe || isSwift;
  } else if (country === "us") {
    valid = isUsRouting || isSwift;
  } else if (country === "ca") {
    valid = isCaTransit || isSwift;
  } else if (country === "au" || country === "nz") {
    valid = isBsb || isSwift;
  } else if (allowIbanCountries.has(country)) {
    valid = isIban || isSwift;
  } else {
    // Fallback: accept IBAN-like or SWIFT or numeric identifiers
    valid = isIban || isSwift || /^\d+$/.test(id);
  }

  if (!valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Identificador inválido para el país seleccionado. Use IBAN, SWIFT/BIC, CLABE (MX), BSB (AU/NZ) o número de tránsito (CA/US) según corresponda.",
      path: ["iban"],
    });
  }
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    if (error.response?.status === 403) {
      return "Solo CompanyAdmin puede gestionar cuentas bancarias de su propia empresa.";
    }

    if (error.response?.data) {
      const responseData = error.response.data as {
        message?: unknown;
        errors?: Record<string, string[]>;
      };

      // First try to get a direct message
      if (typeof responseData.message === "string" && responseData.message) {
        return responseData.message;
      }

      // Then try to extract field-specific errors
      if (responseData.errors && typeof responseData.errors === "object") {
        const errorMessages = Object.values(responseData.errors)
          .flat()
          .filter((msg) => typeof msg === "string" && msg.length > 0);

        if (errorMessages.length > 0) {
          return errorMessages.join(" | ");
        }
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
    setError,
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
      regionOther: "",
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
    { id: "gb", name: "United Kingdom" },
    { id: "es", name: "Spain" },
    { id: "fr", name: "France" },
    { id: "de", name: "Germany" },
    { id: "it", name: "Italy" },
    { id: "pt", name: "Portugal" },
    { id: "nl", name: "Netherlands" },
    { id: "be", name: "Belgium" },
    { id: "ch", name: "Switzerland" },
    { id: "at", name: "Austria" },
    { id: "jp", name: "Japan" },
    { id: "cn", name: "China" },
    { id: "in", name: "India" },
    { id: "sg", name: "Singapore" },
    { id: "kr", name: "South Korea" },
    { id: "th", name: "Thailand" },
    { id: "my", name: "Malaysia" },
    { id: "id", name: "Indonesia" },
    { id: "vn", name: "Vietnam" },
    { id: "ph", name: "Philippines" },
  ];

  // Load regions via hook (tries VITE_REGIONS_URL then falls back to local JSON)
  const { regionsByCountry, loading: regionsLoading } = useRegions();

  const watchedCountry = watch("country");
  const ibanRegister = register("iban");
  const onSubmit = async (data: BankAccountFormValues) => {
    if (!profileCompanyId) {
      toast.error("Tu usuario no tiene una empresa asignada", {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    const countryName = countryOptions.find((c) => c.id === data.country)?.name ?? data.country;
    const regionName =
      data.region === "other"
        ? (data.regionOther ?? "").trim()
        : (regionsByCountry[data.country] || []).find((r) => r.id === data.region)?.name ?? data.region;

    if (!regionName) {
      // If user selected Other but didn't type a region, show validation
      setError("region", { type: "manual", message: "Escriba la región" });
      return;
    }

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
        regionOther: "",
        iban: "",
      });

      navigate("/admin/bank-accounts");
    } catch (error) {
      toast.error(getErrorMessage(error, "Error al crear la cuenta bancaria"), {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
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
                                  setValue("regionOther", "");
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
                  const selectOptions = regionOptions.length > 0 ? [...regionOptions, { id: "other", name: "Otro (escribir)" }] : [{ id: "other", name: "Otro (escribir)" }];
                  const selected = selectOptions.find((o) => o.id === field.value) || null;

                  // If no country selected yet, show disabled select
                  if (!watchedCountry) {
                    return (
                      <>
                        <Select
                          id="bank-account-region"
                          options={[]}
                          value={null}
                          onChange={() => {}}
                          placeholder={"Selecciona país primero"}
                          isDisabled
                        />
                        <FieldError msg={errors.region?.message} />
                      </>
                    );
                  }

                  // Render the Select always (it will contain the 'Other' option)
                  return (
                    <>
                      <Select
                        id="bank-account-region"
                        options={selectOptions}
                        value={selected}
                        onChange={(opt) => {
                          field.onChange(opt.id);
                          // clear manual input when choosing a real option
                          if (opt.id !== "other") setValue("regionOther", "");
                        }}
                        placeholder={regionsLoading ? "Cargando regiones..." : "Selecciona una región"}
                        isDisabled={regionsLoading}
                      />

                      {field.value === "other" && (
                        <div className="mt-2">
                          <Input id="bank-account-region-other" {...register("regionOther")} placeholder="Escribe la región" />
                          <FieldError msg={errors.regionOther?.message} />
                        </div>
                      )}

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
                  Identificador de cuenta (IBAN / CLABE / SWIFT / Transit / BSB)
                </label>
                <Input
                  id="bank-account-iban"
                  {...ibanRegister}
                  onBlur={(e: any) => {
                    ibanRegister.onBlur?.(e);
                    const formatted = formatIdentifierForCountry(watchedCountry, e.target.value);
                    setValue("iban", formatted);
                  }}
                  placeholder="Ej: IBAN: GB82WEST..., SWIFT: BKENGB2L, CLABE: 012345678901234567"
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
                    regionOther: "",
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
