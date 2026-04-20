import { useState } from "react";
import { RefundPoliciesByCompany, RefundPolicy } from "../../types/refundPolicies";

interface RefundPoliciesListProps {
  groups: RefundPoliciesByCompany[];
  isLoading: boolean;
  onCreate: () => void;
  onView: (policy: RefundPolicy) => void;
  onEdit: (policy: RefundPolicy) => void;
  onDelete: (policy: RefundPolicy) => void;
}

export const RefundPoliciesList = ({
  groups,
  isLoading,
  onCreate,
  onView,
  onEdit,
  onDelete,
}: RefundPoliciesListProps) => {
  const [openCompanyIds, setOpenCompanyIds] = useState<Record<string, boolean>>({});

  const toggleCompany = (companyId: string) => {
    setOpenCompanyIds((prev) => ({
      ...prev,
      [companyId]: !prev[companyId],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12 text-gray-500 text-sm">
        Cargando políticas de reembolso...
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500 text-sm">No hay políticas registradas.</p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-4 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          Crear primera política
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Políticas por compañía</h2>
          <p className="text-sm text-gray-500 mt-0.5">Vista agrupada según la respuesta de /refund-policies.</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          + Nueva política
        </button>
      </div>

      {groups.map((group) => {
        const isOpen = openCompanyIds[group.company.id] ?? true;

        return (
          <section key={group.company.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleCompany(group.company.id)}
              className="w-full px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-left"
            >
              <div>
                <h3 className="text-base font-semibold text-gray-800">
                  {group.company.name} {group.company.key ? `(${group.company.key})` : ""}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{group.policies.length} políticas</p>
              </div>
              <span className="text-gray-500 text-sm">{isOpen ? "Ocultar" : "Mostrar"}</span>
            </button>

            {isOpen && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-5 text-sm font-medium text-gray-600">Nombre</th>
                      <th className="py-3 px-5 text-sm font-medium text-gray-600">Descripción</th>
                      <th className="py-3 px-5 text-sm font-medium text-gray-600 text-center">Reglas</th>
                      <th className="py-3 px-5 text-sm font-medium text-gray-600 text-center">Estado</th>
                      <th className="py-3 px-5 text-sm font-medium text-gray-600 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.policies.map((policy) => (
                      <tr key={policy.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-5 font-medium text-gray-800">{policy.name}</td>
                        <td className="py-4 px-5 text-gray-600 text-sm">{policy.description || "Sin descripción"}</td>
                        <td className="py-4 px-5 text-center text-sm text-gray-600">{policy.rules.length}</td>
                        <td className="py-4 px-5 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              policy.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {policy.is_active ? "Activa" : "Inactiva"}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex justify-center gap-2 text-sm">
                            <button
                              type="button"
                              onClick={() => onView(policy)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Ver
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              type="button"
                              onClick={() => onEdit(policy)}
                              className="text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                              Editar
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              type="button"
                              onClick={() => onDelete(policy)}
                              className="text-red-500 hover:text-red-700 font-medium"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {group.policies.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 px-5 text-sm text-gray-500 text-center">
                          Esta compañía no tiene políticas registradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};
