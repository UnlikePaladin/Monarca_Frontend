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
import { useAuth } from "../../hooks/auth/authContext";
import { useCreateCompanyDepartment } from "../../hooks/companies/useCreateCompanyDepartment";
import { useGetCompany } from "../../hooks/companies/useGetCompany";
import { useGetCompanyDepartments } from "../../hooks/companies/useGetCompanyDepartments";
import { CreateCompanyDepartmentPayload } from "../../types/company";

type CostCenterOption = { id: number; name: string };

const costCenterOptions: CostCenterOption[] = [
  { id: 100, name: "Planta" },
  { id: 101, name: "Mercadeo" },
  { id: 102, name: "Sistemas" },
  { id: 103, name: "Contabilidad" },
];

const departmentSchema = z.object({
  name: z.string().trim().min(1, {
    message: "Escriba el nombre del departamento",
  }),
  cost_center_id: z.number({
    required_error: "Seleccione un centro de costos",
    invalid_type_error: "Seleccione un centro de costos",
  }),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    // Handle 403 Forbidden specifically
    if (error.response?.status === 403) {
      return "Solo CompanyAdmin puede crear departamentos para su propia empresa.";
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

function CreateDepartmentForm() {
  const { authState } = useAuth();

  const profileCompanyId = authState.userCompanyId ?? "";
  const companyIdForDepartment = profileCompanyId;

  const {
    data: selectedCompany,
    isLoading: isLoadingCompany,
    error: companyError,
  } = useGetCompany(companyIdForDepartment);
  const {
    data: companyDepartments = [],
    isLoading: isLoadingDepartments,
    error: departmentsError,
  } = useGetCompanyDepartments(companyIdForDepartment);

  const costCenterSelectOptions = useMemo(() => costCenterOptions, []);

  const { mutateAsync: createCompanyDepartmentMutation, isPending: isCreatingDepartment } =
    useCreateCompanyDepartment(companyIdForDepartment);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      cost_center_id: costCenterOptions[0]?.id ?? 100,
    },
  });

  const onSubmit = async (data: DepartmentFormValues) => {
    if (!companyIdForDepartment) {
      toast.error("Tu usuario no tiene una empresa asignada", {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    const payload: CreateCompanyDepartmentPayload = {
      name: data.name.trim(),
      cost_center_id: data.cost_center_id,
    };

    try {
      await createCompanyDepartmentMutation(payload);
      toast.success("Departamento creado correctamente", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });

      reset({
        name: "",
        cost_center_id: costCenterOptions[0]?.id ?? 100,
      });
    } catch (error) {
      toast.error(getErrorMessage(error, "Error al crear el departamento"), {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  };

  if (!companyIdForDepartment) {
    return (
      <section className="rounded-md bg-gray-200">
        <div className="mx-auto max-w-3xl px-4 py-8 lg:py-16">
          <h2 className="text-xl font-bold text-gray-900">Crear departamento</h2>
          <p className="mt-2 text-sm text-red-600">
            No se pudo resolver tu empresa desde el departamento del perfil.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-md bg-gray-200">
      <div className="mx-auto max-w-3xl px-4 py-8 lg:py-16">
        <div className="mb-6 space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Crear departamento</h2>
          <p className="text-sm text-gray-600">
            Como CompanyAdmin, solo puedes crear departamentos para tu empresa.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div id="tenant_company">
            <label
              htmlFor="department-company"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              Empresa
            </label>
            <div
              id="department-company"
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
            <FieldError
              msg={companyError instanceof Error ? companyError.message : undefined}
            />
          </div>

          <div id="tenant_departments" className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Datos del departamento</h3>

            <div>
              <label
                htmlFor="department-name"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Nombre del departamento
              </label>
              <Input id="department-name" {...register("name")} />
              <FieldError msg={errors.name?.message} />
            </div>

            <div>
              <label
                htmlFor="department-cost-center"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Centro de costos
              </label>
              <Controller
                control={control}
                name="cost_center_id"
                render={({ field }) => (
                  <Select
                    id="department-cost-center"
                    options={costCenterSelectOptions}
                    value={
                      costCenterSelectOptions.find((option) => option.id === field.value) ??
                      null
                    }
                    onChange={(option) => field.onChange(Number(option.id))}
                    placeholder="Selecciona un centro de costos"
                  />
                )}
              />
              <FieldError msg={errors.cost_center_id?.message} />
            </div>

            <div className="rounded-md bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-gray-900">Departamentos registrados</p>
              {isLoadingDepartments ? (
                <p className="mt-2 text-sm text-gray-600">Cargando departamentos...</p>
              ) : (
                <p className="mt-2 text-sm text-gray-600">
                  Total actual: {companyDepartments.length}
                </p>
              )}
              <FieldError
                msg={
                  departmentsError instanceof Error ? departmentsError.message : undefined
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              id="create_department"
              type="submit"
              disabled={
                isCreatingDepartment ||
                isSubmitting ||
                isLoadingCompany ||
                !selectedCompany
              }
            >
              {isCreatingDepartment || isSubmitting ? "Guardando..." : "Crear departamento"}
            </Button>
            <Button
              type="button"
              onClick={() =>
                reset({
                  name: "",
                  cost_center_id: costCenterOptions[0]?.id ?? 100,
                })
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

export default CreateDepartmentForm;
