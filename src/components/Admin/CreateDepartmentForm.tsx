import { useEffect, useMemo } from "react";

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
import { useGetCostCenters } from "../../hooks/companies/useGetCostCenters";
import { useGetCompanyDepartments } from "../../hooks/companies/useGetCompanyDepartments";
import { CreateCompanyDepartmentPayload } from "../../types/company";
import { useNavigate } from "react-router-dom";

type CostCenterOption = { id: number; name: string };

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
  const navigate = useNavigate();

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
  const {
    data: costCenters = [],
    isLoading: isLoadingCostCenters,
    error: costCentersError,
  } = useGetCostCenters();

  const costCenterSelectOptions = useMemo(() => {
    const options = costCenters
      .map((costCenter) => {
        const candidateId =
          typeof costCenter.numericId === "number" && Number.isInteger(costCenter.numericId)
            ? costCenter.numericId
            : Number(costCenter.id);

        if (!Number.isInteger(candidateId) || candidateId <= 0) {
          return null;
        }

        const formattedName = costCenter.key
          ? `${costCenter.name} (${costCenter.key})`
          : costCenter.name;

        return {
          id: candidateId,
          name: formattedName,
        };
      })
      .filter((option): option is CostCenterOption => option !== null);

    return options.filter(
      (option, index, current) =>
        current.findIndex((currentOption) => currentOption.id === option.id) === index
    );
  }, [costCenters]);

  const { mutateAsync: createCompanyDepartmentMutation, isPending: isCreatingDepartment } =
    useCreateCompanyDepartment(companyIdForDepartment);

  const {
    control,
    register,
    handleSubmit,
    getValues,
    reset,
    setValue,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    const firstCostCenterOption = costCenterSelectOptions[0];
    if (!firstCostCenterOption) return;

    const currentCostCenterId = getValues("cost_center_id");
    const hasSelectedCostCenter = costCenterSelectOptions.some(
      (option) => option.id === currentCostCenterId
    );

    if (!hasSelectedCostCenter) {
      setValue("cost_center_id", firstCostCenterOption.id, {
        shouldValidate: true,
      });
    }
  }, [costCenterSelectOptions, getValues, setValue]);

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
        cost_center_id: costCenterSelectOptions[0]?.id,
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
    navigate("/admin/departments")
  };

  if (!companyIdForDepartment) {
    return (
      <section className="rounded-md">
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
    <section className="rounded-md">
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
                    isLoading={isLoadingCostCenters}
                    isDisabled={isLoadingCostCenters || costCenterSelectOptions.length === 0}
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
              {!isLoadingCostCenters && costCenterSelectOptions.length === 0 && (
                <p className="mt-1 text-sm text-gray-600">
                  No hay centros de costos disponibles para seleccionar.
                </p>
              )}
              <FieldError
                msg={costCentersError instanceof Error ? costCentersError.message : undefined}
              />
            </div>

            <div className="rounded-md bg-white p-4 shadow-lg">
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

          <div className="flex justify-between">            
            <div className="flex flex-wrap items-center gap-3">
              <Button
                id="create_department"
                type="submit"
                disabled={
                  isCreatingDepartment ||
                  isSubmitting ||
                  isLoadingCompany ||
                  isLoadingCostCenters ||
                  costCenterSelectOptions.length === 0 ||
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
                    cost_center_id: costCenterSelectOptions[0]?.id,
                  })
                }
              >
                Limpiar formulario
              </Button>
            </div>
            <Button
              type="button"
              onClick={() =>
                navigate("/admin/departments")
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

export default CreateDepartmentForm;
