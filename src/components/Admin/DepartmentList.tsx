import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { toast } from "react-toastify";

import { Button } from "../ui/Button";
import FieldError from "../ui/FieldError";
import { useAuth } from "../../hooks/auth/authContext";
import { useGetCompany } from "../../hooks/companies/useGetCompany";
import { useGetCompanyDepartments } from "../../hooks/companies/useGetCompanyDepartments";
import { useGetCostCenters } from "../../hooks/companies/useGetCostCenters";
import { useUpdateCompanyDepartmentCostCenter } from "../../hooks/companies/useUpdateCompanyDepartmentCostCenter";

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    if (error.response?.status === 403) {
      return "Solo CompanyAdmin puede gestionar departamentos de su propia empresa.";
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

function DepartmentList() {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);
  const [selectedEditCostCenterId, setSelectedEditCostCenterId] = useState<number | null>(null);
  const [updatingDepartmentId, setUpdatingDepartmentId] = useState<string | null>(null);

  const profileCompanyId = authState.userCompanyId ?? "";

  const {
    data: selectedCompany,
    isLoading: isLoadingCompany,
    error: companyError,
  } = useGetCompany(profileCompanyId);

  const {
    data: companyDepartments = [],
    isLoading: isLoadingDepartments,
    error: departmentsError,
  } = useGetCompanyDepartments(profileCompanyId);

  const {
    data: costCenters = [],
    error: costCentersError,
  } = useGetCostCenters();

  const {
    mutateAsync: updateCompanyDepartmentCostCenterMutation,
    isPending: isUpdatingDepartmentCostCenter,
  } = useUpdateCompanyDepartmentCostCenter(profileCompanyId);

  const costCenterLabelsById = useMemo(() => {
    const labels = new Map<number, string>();

    costCenters.forEach((costCenter) => {
      const candidateId =
        typeof costCenter.numericId === "number" && Number.isInteger(costCenter.numericId)
          ? costCenter.numericId
          : Number(costCenter.id);

      if (!Number.isInteger(candidateId) || candidateId <= 0) return;

      const label = costCenter.key
        ? `${costCenter.name} (${costCenter.key})`
        : costCenter.name;

      labels.set(candidateId, label);
    });

    return labels;
  }, [costCenters]);

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
      .filter((option): option is { id: number; name: string } => option !== null);

    return options.filter(
      (option, index, current) =>
        current.findIndex((currentOption) => currentOption.id === option.id) === index
    );
  }, [costCenters]);

  const handleStartEditDepartment = (departmentId: string, currentCostCenterId: number) => {
    setEditingDepartmentId(departmentId);
    setSelectedEditCostCenterId(currentCostCenterId);
  };

  const handleCancelEditDepartment = () => {
    setEditingDepartmentId(null);
    setSelectedEditCostCenterId(null);
  };

  const handleUpdateDepartmentCostCenter = async (
    departmentId: string,
    departmentName: string,
    currentCostCenterId: number,
    selectedCostCenterId: number
  ) => {

    if (selectedCostCenterId === currentCostCenterId) {
      toast.info("Selecciona un centro de costos diferente para actualizar.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      setUpdatingDepartmentId(departmentId);
      await updateCompanyDepartmentCostCenterMutation({
        departmentId,
        cost_center_id: selectedCostCenterId,
      });

      toast.success(`Centro de costos actualizado para ${departmentName}`, {
        position: "top-right",
        autoClose: 3000,
      });

      setEditingDepartmentId(null);
      setSelectedEditCostCenterId(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Error al actualizar el centro de costos"), {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setUpdatingDepartmentId(null);
    }
  };

  if (!profileCompanyId) {
    return (
      <section className="rounded-md">
        <div className="mx-auto max-w-5xl px-4 py-8 lg:py-16">
          <h2 className="text-xl font-bold text-gray-900">Departamentos</h2>
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
          <h2 className="text-xl font-bold text-gray-900">Departamentos</h2>
          <p className="text-sm text-gray-600">
            Como CompanyAdmin, solo puedes ver y gestionar departamentos para tu empresa.
          </p>
        </div>

        <div id="tenant_company" className="mb-6">
          <label
            htmlFor="department-list-company"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Empresa
          </label>
          <div
            id="department-list-company"
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

        <div id="tenant_departments" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Departamentos registrados</h3>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                className="!bg-white !text-[var(--blue)] !border !border-[var(--blue)] hover:!bg-[var(--blue)] hover:!text-white"
                onClick={() => navigate("/admin/departments/import")}
              >
                Importar desde Excel
              </Button>
              <Button
                id="create_department"
                type="button"
                onClick={() => navigate("/admin/departments/create")}
              >
                Crear departamento
              </Button>
            </div>
          </div>

          <div className="rounded-md bg-white p-4 shadow-lg">
            {isLoadingDepartments ? (
              <p className="text-sm text-gray-600">Cargando departamentos...</p>
            ) : companyDepartments.length === 0 ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">Aun no hay departamentos</p>
                <p className="text-sm text-gray-600">Crea el primero para empezar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md shadow-md">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">Nombre</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">Centro de costos</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyDepartments.map((department) => {
                      const costCenterLabel =
                        costCenterLabelsById.get(department.cost_center_id) ??
                        `ID ${department.cost_center_id}`;
                      const isRowUpdating =
                        isUpdatingDepartmentCostCenter && updatingDepartmentId === department.id;
                      const isEditingDepartment = editingDepartmentId === department.id;
                      const selectedCostCenterId =
                        selectedEditCostCenterId ?? department.cost_center_id;

                      return (
                        <>
                          <tr key={department.id} className="border-b border-gray-100">
                            <td className="py-3 px-4 text-sm text-gray-900">{department.name}</td>
                            <td className="py-3 px-4 text-sm text-gray-700">{costCenterLabel}</td>
                            <td className="py-3 px-4 text-sm text-gray-700">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isEditingDepartment) {
                                    handleCancelEditDepartment();
                                  } else {
                                    handleStartEditDepartment(
                                      department.id,
                                      department.cost_center_id
                                    );
                                  }
                                }}
                                disabled={isRowUpdating || costCenterSelectOptions.length === 0}
                                className="font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                              >
                                {isEditingDepartment ? "Cerrar" : "Editar"}
                              </button>
                            </td>
                          </tr>

                          {isEditingDepartment && (
                            <tr className="border-b border-gray-100 bg-gray-50">
                              <td colSpan={3} className="py-3 px-4">
                                <div className="flex flex-wrap items-center gap-2">
                                  <select
                                    aria-label={`Seleccionar centro de costos para ${department.name}`}
                                    value={selectedCostCenterId}
                                    onChange={(event) => {
                                      const nextCostCenterId = Number(event.target.value);
                                      setSelectedEditCostCenterId(nextCostCenterId);
                                    }}
                                    disabled={isRowUpdating || costCenterSelectOptions.length === 0}
                                    className="w-full max-w-md rounded-md p-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:bg-gray-100"
                                  >
                                    {costCenterSelectOptions.map((option) => (
                                      <option key={option.id} value={option.id}>
                                        {option.name}
                                      </option>
                                    ))}
                                  </select>

                                  <Button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateDepartmentCostCenter(
                                        department.id,
                                        department.name,
                                        department.cost_center_id,
                                        selectedCostCenterId
                                      )
                                    }
                                    disabled={
                                      isRowUpdating ||
                                      costCenterSelectOptions.length === 0 ||
                                      selectedCostCenterId === department.cost_center_id
                                    }
                                  >
                                    {isRowUpdating ? "Guardando..." : "Guardar cambios"}
                                  </Button>

                                  <Button
                                    type="button"
                                    onClick={handleCancelEditDepartment}
                                    disabled={isRowUpdating}
                                    className="bg-gray-200 text-gray-900 hover:bg-gray-300"
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!isLoadingDepartments && (
              <p className="mt-3 text-sm text-gray-600">Total actual: {companyDepartments.length}</p>
            )}

            <FieldError
              msg={departmentsError instanceof Error ? departmentsError.message : undefined}
            />
            <FieldError
              msg={costCentersError instanceof Error ? costCentersError.message : undefined}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default DepartmentList;
