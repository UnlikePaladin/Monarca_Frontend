import { useNavigate } from "react-router-dom";

import { Button } from "../ui/Button";
import FieldError from "../ui/FieldError";
import { useGetCompanies } from "../../hooks/companies/useGetCompanies";

function CompanyList() {
  const navigate = useNavigate();

  const {
    data: companies = [],
    isLoading: isLoadingCompanies,
    error: companiesError,
  } = useGetCompanies();

  return (
    <section className="rounded-md">
      <div className="mx-auto max-w-5xl px-4 py-8 lg:py-16">
        <div className="mb-6 space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Empresas</h2>
          <p className="text-sm text-gray-600">
            Como SuperAdmin, puedes consultar todas las empresas registradas y crear nuevas.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Empresas registradas</h3>
            <Button type="button" onClick={() => navigate("/admin/companies/create")}>Crear empresa</Button>
          </div>

          <div className="rounded-md bg-white p-4 shadow-lg">
            {isLoadingCompanies ? (
              <p className="text-sm text-gray-600">Cargando empresas...</p>
            ) : companies.length === 0 ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">Aún no hay empresas registradas</p>
                <p className="text-sm text-gray-600">Crea una empresa para comenzar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md shadow-md">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">Nombre</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">Clave</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-600">Moneda local</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr key={company.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm text-gray-900">{company.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{company.key}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{company.localCurrency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!isLoadingCompanies && (
              <p className="mt-3 text-sm text-gray-600">Total actual: {companies.length}</p>
            )}

            <FieldError msg={companiesError instanceof Error ? companiesError.message : undefined} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default CompanyList;
