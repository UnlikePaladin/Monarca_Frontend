import { RefundPolicy } from "../../types/refundPolicies";

interface RefundPolicyDetailProps {
  policy: RefundPolicy;
  onClose: () => void;
  onEdit: (policy: RefundPolicy) => void;
}

export const RefundPolicyDetail = ({
  policy,
  onClose,
  onEdit,
}: RefundPolicyDetailProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Detalle de política</h3>
          <p className="text-sm text-gray-500 mt-0.5">Consulta completa de configuración y reglas.</p>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            policy.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {policy.is_active ? "Activa" : "Inactiva"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 text-sm">
        <div>
          <p className="text-gray-500">Nombre</p>
          <p className="text-gray-900 font-medium">{policy.name}</p>
        </div>
        <div>
          <p className="text-gray-500">Compañía</p>
          <p className="text-gray-900 font-medium">
            {policy.company?.name || "Sin nombre"}
            {policy.company?.key ? ` (${policy.company.key})` : ""}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Fecha de creación</p>
          <p className="text-gray-900 font-medium">
            {policy.created_at ? new Date(policy.created_at).toLocaleString() : "No disponible"}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Total de reglas</p>
          <p className="text-gray-900 font-medium">{policy.rules.length}</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-gray-500 text-sm">Descripción</p>
        <p className="text-gray-900 text-sm mt-1 whitespace-pre-line">
          {policy.description || "Sin descripción"}
        </p>
      </div>

      <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-700">Reglas</p>
        </div>
        {policy.rules.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">Esta política no tiene reglas registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 px-4 text-gray-600 font-medium">Clase gasto</th>
                  <th className="py-2 px-4 text-gray-600 font-medium">Operador</th>
                  <th className="py-2 px-4 text-gray-600 font-medium">Umbral</th>
                  <th className="py-2 px-4 text-gray-600 font-medium">Consecuencia</th>
                  <th className="py-2 px-4 text-gray-600 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {policy.rules.map((rule, index) => (
                  <tr key={rule.id ?? `${rule.expense_class}-${index}`} className="border-b border-gray-100">
                    <td className="py-2 px-4 text-gray-800">{rule.expense_class}</td>
                    <td className="py-2 px-4 text-gray-800">{rule.operator}</td>
                    <td className="py-2 px-4 text-gray-800">
                      {rule.threshold_value ?? "-"}
                      {rule.threshold_unit ? ` ${rule.threshold_unit}` : ""}
                    </td>
                    <td className="py-2 px-4 text-gray-800">{rule.consequence || "POLICY_VIOLATION"}</td>
                    <td className="py-2 px-4 text-gray-800">
                      {rule.is_active === false ? "Inactiva" : "Activa"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
        >
          Volver
        </button>
        <button
          type="button"
          onClick={() => onEdit(policy)}
          className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          Editar
        </button>
      </div>
    </div>
  );
};
