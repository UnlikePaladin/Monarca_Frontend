import { useNavigate } from "react-router-dom";

import { Button } from "../ui/Button";
import FieldError from "../ui/FieldError";
import { useAuth } from "../../hooks/auth/authContext";
import { useGetCompany } from "../../hooks/companies/useGetCompany";
import { useGetCostCenters } from "../../hooks/companies/useGetCostCenters";

function CostCenterList() {
  const navigate = useNavigate();
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

  if (!profileCompanyId) {
    return (
      <section className="rounded-md">
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
    <section className="rounded-md">
      <div className="mx-auto max-w-5xl px-4 py-8 lg:py-16">
        <div className="mb-6 space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Centros de costos</h2>
          <p className="text-sm text-gray-600">
            Como CompanyAdmin, solo puedes ver y gestionar centros de costos para tu empresa.
          </p>
        </div>

        <div id="tenant_company" className="mb-6">
          <label
            htmlFor="cost-center-list-company"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Empresa
          </label>
          <div
            id="cost-center-list-company"
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
              id="create_cost_center"
              type="button"
              onClick={() => navigate("/admin/cost-centers/create")}
            >
              Crear centro de costos
            </Button>
          </div>

          <div className="rounded-md bg-white p-4 shadow-lg">
            {isLoadingCostCenters ? (
              <p className="text-sm text-gray-600">Cargando centros de costos...</p>
            ) : costCenters.length === 0 ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">Aun no hay centros de costos</p>
                <p className="text-sm text-gray-600">Crea el primero para empezar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md shadow-md">
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
                        <td className="py-3 px-4 text-sm text-gray-700">{costCenter.numericId ?? "-"}</td>
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
      </div>
    </section>
  );
}

export default CostCenterList;
