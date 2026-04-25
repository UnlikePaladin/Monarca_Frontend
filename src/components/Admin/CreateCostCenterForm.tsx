import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "react-toastify";

import { Button } from "../ui/Button";
import FieldError from "../ui/FieldError";
import { Input } from "../ui/Input";
import { useAuth } from "../../hooks/auth/authContext";
import { useCreateCostCenter } from "../../hooks/companies/useCreateCostCenter";
import { useGetCompany } from "../../hooks/companies/useGetCompany";
import { useGetCostCenters } from "../../hooks/companies/useGetCostCenters";
import { CreateCostCenterPayload } from "../../types/costCenter";

const costCenterSchema = z.object({
  name: z.string().trim().min(1, {
    message: "Escriba el nombre del centro de costos",
  }),
  numericId: z
    .string()
    .trim()
    .refine((value) => !value || /^[1-9]\d*$/.test(value), {
      message: "El ID numérico debe ser un entero mayor a 0",
    }),
  key: z
    .string()
    .trim()
    .max(10, {
      message: "La clave debe tener máximo 10 caracteres",
    }),
});

type CostCenterFormValues = z.infer<typeof costCenterSchema>;

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    if (error.response?.status === 403) {
      return "Solo CompanyAdmin puede gestionar centros de costos de su propia empresa.";
    }

    if (error.response?.data) {
      const responseData = error.response.data as { message?: unknown };
      if (typeof responseData.message === "string" && responseData.message) {
        return responseData.message;
      }
    }
  }

  return fallback;
};

function CreateCostCenterForm() {
  const { authState } = useAuth();

  const profileCompanyId = authState.userCompanyId ?? "";

  const {
    data: selectedCompany,
    isLoading: isLoadingCompany,
    error: companyError,
  } = useGetCompany(profileCompanyId);
  const {
    data: costCenters = [],
    isLoading: isLoadingCostCenters,
    error: costCentersError,
  } = useGetCostCenters();

  const { mutateAsync: createCostCenterMutation, isPending: isCreatingCostCenter } =
    useCreateCostCenter();

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<CostCenterFormValues>({
    resolver: zodResolver(costCenterSchema),
    defaultValues: {
      name: "",
      numericId: "",
      key: "",
    },
  });

  const onSubmit = async (data: CostCenterFormValues) => {
    if (!profileCompanyId) {
      toast.error("Tu usuario no tiene una empresa asignada", {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    const payload: CreateCostCenterPayload = {
      name: data.name.trim(),
      ...(data.numericId
        ? { numericId: Number(data.numericId) }
        : {}),
      ...(data.key ? { key: data.key.trim() } : {}),
    };

    try {
      await createCostCenterMutation(payload);

      toast.success("Centro de costos creado correctamente", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });

      reset({
        name: "",
        numericId: "",
        key: "",
      });
    } catch (error) {
      toast.error(getErrorMessage(error, "Error al crear el centro de costos"), {
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
      <section className="rounded-md bg-gray-200">
        <div className="mx-auto max-w-5xl px-4 py-8 lg:py-16">
          <h2 className="text-xl font-bold text-gray-900">Centros de costos</h2>
          <p className="mt-2 text-sm text-red-600">
            No se pudo resolver tu empresa desde el departamento del perfil.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-md bg-gray-200">
      <div className="mx-auto max-w-5xl px-4 py-8 lg:py-16">
        <div className="mb-6 space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Centros de costos</h2>
          <p className="text-sm text-gray-600">
            Como CompanyAdmin, solo puedes gestionar centros de costos para tu empresa.
          </p>
        </div>

        <div id="tenant_company" className="mb-6">
          <label
            htmlFor="cost-center-company"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Empresa
          </label>
          <div
            id="cost-center-company"
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

        <div id="tenant_cost_centers" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Centros de costos registrados</h3>
            <Button
              type="button"
              onClick={() => document.getElementById("cost-center-name")?.focus()}
            >
              Crear centro de costos
            </Button>
          </div>

          <div className="rounded-md bg-white p-4 shadow-sm">
            {isLoadingCostCenters ? (
              <p className="text-sm text-gray-600">Cargando centros de costos...</p>
            ) : costCenters.length === 0 ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">Aun no hay centros de costos</p>
                <p className="text-sm text-gray-600">Crea el primero para empezar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">Nombre</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">ID numérico</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">Clave</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costCenters.map((costCenter) => (
                      <tr key={costCenter.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm text-gray-900">{costCenter.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {costCenter.numericId ?? "-"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">{costCenter.key ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!isLoadingCostCenters && (
              <p className="mt-3 text-sm text-gray-600">Total actual: {costCenters.length}</p>
            )}
            <FieldError
              msg={costCentersError instanceof Error ? costCentersError.message : undefined}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Datos del centro de costos</h3>

            <div>
              <label
                htmlFor="cost-center-name"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Nombre del centro de costos
              </label>
              <Input id="cost-center-name" {...register("name")} />
              <FieldError msg={errors.name?.message} />
            </div>

            <div>
              <label
                htmlFor="cost-center-numeric-id"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                ID numérico (opcional)
              </label>
              <Input
                id="cost-center-numeric-id"
                inputMode="numeric"
                maxLength={10}
                placeholder="Ej. 105"
                {...register("numericId", {
                  onChange: (event) => {
                    const target = event.target as HTMLInputElement;
                    target.value = target.value.replace(/\D/g, "");
                  },
                })}
              />
              <FieldError msg={errors.numericId?.message} />
            </div>

            <div>
              <label
                htmlFor="cost-center-key"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Clave (opcional)
              </label>
              <Input
                id="cost-center-key"
                maxLength={10}
                placeholder="Ej. CeC01"
                {...register("key")}
              />
              <FieldError msg={errors.key?.message} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              id="create_cost_center"
              type="submit"
              disabled={
                isCreatingCostCenter ||
                isSubmitting ||
                isLoadingCompany ||
                !selectedCompany
              }
            >
              {isCreatingCostCenter || isSubmitting ? "Guardando..." : "Crear centro de costos"}
            </Button>
            <Button
              type="button"
              onClick={() =>
                reset({
                  name: "",
                  numericId: "",
                  key: "",
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

export default CreateCostCenterForm;