/**
 * CreateTenantForm.tsx
 *
 * Form component for creating a tenant with departments and hardcoded cost centers.
 */

import { useMemo } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { toast } from "react-toastify";
import { AxiosError } from "axios";

import { Button } from "../ui/Button";
import FieldError from "../ui/FieldError";
import { Input } from "../ui/Input";
import Select from "../ui/Select";
import { useCreateEnterprise } from "../../hooks/requests/useCreateEnterprise";

type SelectOption = { id: number | string; name: string };
type CostCenterOption = { id: number; name: string };

const costCenterOptions: CostCenterOption[] = [
  { id: 100, name: "Planta" },
  { id: 101, name: "Mercadeo" },
  { id: 102, name: "Sistemas" },
  { id: 103, name: "Contabilidad" },
];


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


const departmentSchema = z.object({
  name: z.string().trim().min(1, {
    message: "Escriba el nombre del departamento",
  }),
  costCenterId: z.number({
    required_error: "Seleccione un centro de costos",
    invalid_type_error: "Seleccione un centro de costos",
  }),
});

const formSchema = z
  .object({
    name: z.string().trim().min(1, {
      message: "Escriba el nombre de la empresa",
    }),
    currency: z.enum([...currencyCodes] as [string, ...string[]], {
      message: "Seleccione una moneda válida",
    }),
    departments: z.array(departmentSchema).min(1, {
      message: "Agregue al menos un departamento",
    }),
  });

type RawFormValues = z.infer<typeof formSchema>;

const createDefaultDepartment = (): RawFormValues["departments"][number] => ({
  name: "",
  costCenterId: costCenterOptions[0]?.id ?? 100,
});

function CreateTenantForm() {
  const costCenterSelectOptions = useMemo(() => costCenterOptions, []);
  const currencySelectOptions = useMemo<SelectOption[]>(
    () => currencyCodes.map((code) => ({ id: code, name: code })),
    []
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RawFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      currency: "MXN",
      departments: [createDefaultDepartment()],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "departments",
  });

  const { createEnterpriseMutation, isPending } = useCreateEnterprise();

  const onSubmit = async (data: RawFormValues) => {
    const payload = {
      name: data.name.trim(),
      currency: data.currency,
      departments: data.departments.map((department) => ({
        name: department.name.trim(),
        cost_center_id: department.costCenterId,
      })),
    };

    try {
      await createEnterpriseMutation(payload);
      toast.success("Empresa creada correctamente", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      reset({
        name: "",
        currency: "MXN",
        departments: [createDefaultDepartment()],
      });
    } catch (error) {
      let errorMessage = "Error al crear la empresa";

      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  };

  return (
    <section className="rounded-md bg-gray-200">
      <div className="mx-auto max-w-3xl px-4 py-8 lg:py-16">
        <div className="mb-6 space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Datos de la empresa</h2>
          <p className="text-sm text-gray-600">
            Los departamentos pueden compartir el mismo centro de costos.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div id="tenant_info">
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-900">
              Nombre de la empresa
            </label>
            <Input id="name" {...register("name")} />
            <FieldError msg={errors.name?.message} />
          </div>

          <div id="tenant_currency">
            <label
              htmlFor="currency"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              Moneda local
            </label>
            <Controller
              control={control}
              name="currency"
              render={({ field }) => (
                <Select
                  id="currency"
                  options={currencySelectOptions}
                  value={currencySelectOptions.find(
                    (option) => option.id === field.value
                  ) ?? null}
                  onChange={(option) => field.onChange(option.id)}
                  placeholder="Selecciona una moneda"
                />
              )}
            />
            <FieldError msg={errors.currency?.message} />
          </div>

          <div id="tenant_departments" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Departamentos</h3>
                <p className="text-sm text-gray-600">
                  Puedes agregar un departamento por cada centro de costos disponible.
                </p>
              </div>

              <Button
                id="add_department"
                type="button"
                onClick={() => append(createDefaultDepartment())}
                className="whitespace-nowrap"
              >
                + Agregar departamento
              </Button>
            </div>

            <FieldError msg={errors.departments?.message} />

            <div className="space-y-4">
              {fields.map((field, index) => {
                const departmentErrors = errors.departments?.[index];

                return (
                  <div key={field.id} className="rounded-md bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <span className="font-medium text-gray-900">Departamento #{index + 1}</span>
                      {fields.length > 1 && (
                        <Button type="button" onClick={() => remove(index)}>
                          Quitar
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor={`department-name-${index}`}
                          className="mb-2 block text-sm font-medium text-gray-900"
                        >
                          Nombre del departamento
                        </label>
                        <Input
                          id={`department-name-${index}`}
                          {...register(`departments.${index}.name`)}
                        />
                        <FieldError msg={departmentErrors?.name?.message} />
                      </div>

                      <div>
                        <label
                          htmlFor={`department-cost-center-${index}`}
                          className="mb-2 block text-sm font-medium text-gray-900"
                        >
                          Centro de costos
                        </label>
                        <Controller
                          control={control}
                          name={`departments.${index}.costCenterId`}
                          render={({ field: selectField }) => (
                            <Select
                              id={`department-cost-center-${index}`}
                              options={costCenterSelectOptions}
                              value={
                                costCenterSelectOptions.find(
                                  (option) => option.id === selectField.value
                                ) ?? null
                              }
                              onChange={(option) =>
                                selectField.onChange(Number(option.id))
                              }
                              placeholder="Selecciona un centro de costos"
                            />
                          )}
                        />
                        <FieldError msg={departmentErrors?.costCenterId?.message} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button id="create_tenant" type="submit" disabled={isPending || isSubmitting}>
              {isPending || isSubmitting ? "Guardando..." : "Crear empresa"}
            </Button>
            <Button
              type="button"
              onClick={() =>
                reset({ name: "", departments: [createDefaultDepartment()] })
              }
            >
              Limpiar formulario
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default CreateTenantForm;