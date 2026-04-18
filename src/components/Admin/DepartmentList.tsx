import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../ui/Button";
import FieldError from "../ui/FieldError";
import { useAuth } from "../../hooks/auth/authContext";
import { useGetCompany } from "../../hooks/companies/useGetCompany";
import { useGetCompanyDepartments } from "../../hooks/companies/useGetCompanyDepartments";
import { useGetCostCenters } from "../../hooks/companies/useGetCostCenters";

function DepartmentList() {
  const navigate = useNavigate();
  const { authState } = useAuth();

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

  if (!profileCompanyId) {
    return (
      <section className="rounded-md bg-gray-200">
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
    <section className="rounded-md bg-gray-200">
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
            <Button
              id="create_department"
              type="button"
              onClick={() => navigate("/admin/departments/create")}
            >
              Crear departamento
            </Button>
          </div>

          <div className="rounded-md bg-white p-4 shadow-sm">
            {isLoadingDepartments ? (
              <p className="text-sm text-gray-600">Cargando departamentos...</p>
            ) : companyDepartments.length === 0 ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">Aun no hay departamentos</p>
                <p className="text-sm text-gray-600">Crea el primero para empezar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">Nombre</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">Centro de costos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyDepartments.map((department) => {
                      const costCenterLabel =
                        costCenterLabelsById.get(department.cost_center_id) ??
                        `ID ${department.cost_center_id}`;

                      return (
                        <tr key={department.id} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-sm text-gray-900">{department.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{costCenterLabel}</td>
                        </tr>
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
