import { useMemo } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "react-toastify";

import { Button } from "../ui/Button";
import FieldError from "../ui/FieldError";
import { Input } from "../ui/Input";
import Select from "../ui/Select";
import { useCreateCompany } from "../../hooks/companies/useCreateCompany";
import { CreateCompanyPayload } from "../../types/company";
import { useNavigate } from "react-router-dom";

type SelectOption = { id: number | string; name: string };

const currencyCodes: string[] = [
  "MXN",
  "USD",
  "EUR",
  "ARS",
  "PAB",
  "PYG",
  "PEN",
  "UYU",
  "UYI",
  "BZD",
  "INR",
  "CLP",
  "CRC",
  "COP",
  "DOP",
  "GTQ",
  "HNL",
  "NIO",
  "SVC",
  "VUV",
  "WST",
];

const companySchema = z.object({
  key: z.string().trim().min(1, {
    message: "Escriba la clave de la empresa",
  }),
  name: z.string().trim().min(1, {
    message: "Escriba el nombre de la empresa",
  }),
  localCurrency: z.enum([...currencyCodes] as [string, ...string[]], {
    message: "Seleccione una moneda valida",
  }),
  admin: z.object({
    email: z.string().trim().email({
      message: "Escriba un correo valido",
    }),
    name: z.string().trim().min(1, {
      message: "Escriba el nombre del CompanyAdmin",
    }),
    lastName: z.string().trim().min(1, {
      message: "Escriba el apellido del CompanyAdmin",
    }),
    password: z.string().min(1, {
      message: "Escriba una contraseña para el CompanyAdmin",
    }),
    username: z.string().trim().optional(),
  }),
});

type CompanyFormValues = z.infer<typeof companySchema>;

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    // Handle 403 Forbidden specifically
    if (error.response?.status === 403) {
      return "Solo SuperAdmin puede acceder a la creación de empresas.";
    }
    // Handle other API errors with server message
    if (error.response?.data) {
      const responseData = error.response.data as { message?: unknown };
      if (typeof responseData.message === "string" && responseData.message) {
        return responseData.message;
      }
    }
  }
  return fallback;
};

function CreateCompanyForm() {
  const navigate = useNavigate();
  const currencySelectOptions = useMemo<SelectOption[]>(
    () => currencyCodes.map((code) => ({ id: code, name: code })),
    []
  );

  const { mutateAsync: createCompanyMutation, isPending: isCreatingCompany } =
    useCreateCompany();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      key: "",
      name: "",
      localCurrency: "MXN",
      admin: {
        email: "",
        name: "",
        lastName: "",
        password: "",
        username: "",
      },
    },
  });

  const onSubmit = async (data: CompanyFormValues) => {
    const payload: CreateCompanyPayload = {
      key: data.key.trim(),
      name: data.name.trim(),
      localCurrency: data.localCurrency,
      admin: {
        email: data.admin.email.trim(),
        name: data.admin.name.trim(),
        lastName: data.admin.lastName.trim(),
        password: data.admin.password,
        ...(data.admin.username?.trim()
          ? { username: data.admin.username.trim() }
          : {}),
      },
    };

    try {
      await createCompanyMutation(payload);
      toast.success("Empresa creada correctamente y CompanyAdmin generado automaticamente", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });

      reset({
        key: "",
        name: "",
        localCurrency: "MXN",
        admin: {
          email: "",
          name: "",
          lastName: "",
          password: "",
          username: "",
        },
      });
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Error al crear la empresa y su CompanyAdmin"),
        {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        }
      );
    }
    navigate("/admin/companies")
  };

  return (
    <section className="rounded-md">
      <div className="mx-auto max-w-3xl px-4 py-8 lg:py-16">
        <div className="mb-6 space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Crear empresa</h2>
          <p className="text-sm text-gray-600">
            Como SuperAdmin, puedes registrar nuevas companias y crear su usuario CompanyAdmin inicial.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div id="tenant_info">
            <label
              htmlFor="company-key"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              Clave de la empresa
            </label>
            <Input id="company-key" {...register("key")} />
            <FieldError msg={errors.key?.message} />

            <label
              htmlFor="company-name"
              className="mb-2 mt-4 block text-sm font-medium text-gray-900"
            >
              Nombre de la empresa
            </label>
            <Input id="company-name" {...register("name")} />
            <FieldError msg={errors.name?.message} />
          </div>

          <div id="tenant_currency">
            <label
              htmlFor="company-currency"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              Moneda local
            </label>
            <Controller
              control={control}
              name="localCurrency"
              render={({ field }) => (
                <Select
                  id="company-currency"
                  options={currencySelectOptions}
                  value={
                    currencySelectOptions.find((option) => option.id === field.value) ??
                    null
                  }
                  onChange={(option) => field.onChange(option.id)}
                  placeholder="Selecciona una moneda"
                />
              )}
            />
            <FieldError msg={errors.localCurrency?.message} />
          </div>

          <div id="tenant_admin" className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Company Admin</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="admin-name"
                  className="mb-2 block text-sm font-medium text-gray-900"
                >
                  Nombre
                </label>
                <Input id="admin-name" {...register("admin.name")} />
                <FieldError msg={errors.admin?.name?.message} />
              </div>

              <div>
                <label
                  htmlFor="admin-last-name"
                  className="mb-2 block text-sm font-medium text-gray-900"
                >
                  Apellido
                </label>
                <Input id="admin-last-name" {...register("admin.lastName")} />
                <FieldError msg={errors.admin?.lastName?.message} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-2 block text-sm font-medium text-gray-900"
                >
                  Correo
                </label>
                <Input id="admin-email" type="email" {...register("admin.email")} />
                <FieldError msg={errors.admin?.email?.message} />
              </div>

              <div>
                <label
                  htmlFor="admin-username"
                  className="mb-2 block text-sm font-medium text-gray-900"
                >
                  Username (opcional)
                </label>
                <Input id="admin-username" {...register("admin.username")} />
                <FieldError msg={errors.admin?.username?.message} />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Contraseña
              </label>
              <Input id="admin-password" type="password" {...register("admin.password")} />
              <FieldError msg={errors.admin?.password?.message} />
            </div>
          </div>

          <div className="flex justify-between">            
            <div className="flex flex-wrap items-center gap-3">
              <Button
                id="create_tenant"
                type="submit"
                disabled={isCreatingCompany || isSubmitting}
              >
                {isCreatingCompany || isSubmitting ? "Guardando..." : "Crear empresa"}
              </Button>
              <Button
                type="button"
                onClick={() =>
                  reset({
                    key: "",
                    name: "",
                    localCurrency: "MXN",
                    admin: {
                      email: "",
                      name: "",
                      lastName: "",
                      password: "",
                      username: "",
                    },
                  })
                }
              >
                Limpiar formulario
              </Button>
            </div>
             <Button
                type="button"
                onClick={() =>
                  navigate("/admin/companies")
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

export default CreateCompanyForm;
