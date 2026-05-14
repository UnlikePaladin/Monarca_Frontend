/**
 * File: OrgChart.tsx
 * Description: Container component that paints all root nodes of the org tree and
 *              lists rows that could not be assigned to any node (missing employee number).
 */

import { useMemo } from 'react';
import {
  AvailableRole,
  PreviewEmployee,
} from '../../types/importEmployees';
import { OrgTree } from '../../utils/flatToTree';
import OrgChartNode from './OrgChartNode';

type OrgChartProps = {
  tree: OrgTree;
  availableRoles: AvailableRole[];
  roleByEmpNo: Record<string, string>;
};

/**
 * Renders all trees side by side with horizontal scroll and an unidentified section.
 */
const OrgChart = ({ tree, availableRoles, roleByEmpNo }: OrgChartProps) => {
  const rolesById = useMemo(() => {
    const map = new Map<string, AvailableRole>();
    for (const role of availableRoles || []) {
      map.set(role.id, role);
    }
    return map;
  }, [availableRoles]);

  // Check if there's actual hierarchy (any node with children)
  const hasHierarchy = (tree?.roots || []).some(root => root.children.length > 0);

  if (!tree || tree.roots.length === 0 && tree.unidentified.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-500">
        No hay datos para construir el organigrama.
      </div>
    );
  }

  // If no hierarchy exists and all are roots, show a different message
  if (!hasHierarchy && tree.roots.length > 0) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 font-medium mb-2">
            ℹ️ Organigrama sin jerarquía
          </p>
          <p className="text-xs text-blue-700">
            No se puede construir un organigrama porque los empleados no tienen definidos sus jefes inmediatos (bossEmployeeNumber). 
            Asegúrate de incluir la columna "Jefe Inmediato" en tu archivo Excel con el número de empleado del jefe directo.
          </p>
        </div>
        <FlatEmployeesList 
          roots={tree.roots} 
          roleByEmpNo={roleByEmpNo} 
          rolesById={rolesById}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 overflow-x-auto">
        <ul className="flex items-start gap-10 min-w-max">
          {(tree?.roots || []).map((root) => (
            <OrgChartNode
              key={root.employeeNumber}
              node={root}
              roleByEmpNo={roleByEmpNo}
              rolesById={rolesById}
            />
          ))}
        </ul>
      </div>

      {(tree?.unidentified || []).length > 0 && (
        <UnidentifiedList rows={tree?.unidentified || []} />
      )}
    </div>
  );
};

/**
 * Displays a flat list of employees when there's no hierarchy.
 */
const FlatEmployeesList = ({
  roots,
  roleByEmpNo,
  rolesById,
}: {
  roots: any[];
  roleByEmpNo: Record<string, string>;
  rolesById: Map<string, any>;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {roots.map((node) => {
      const { data, employeeNumber } = node;
      const fullName = `${data.name}${data.lastName ? ` ${data.lastName}` : ''}`.trim();
      const assignedRoleId = roleByEmpNo[employeeNumber];
      const assignedRole = assignedRoleId ? rolesById.get(assignedRoleId) : undefined;
      const hasErrors = data.validationErrors.length > 0;

      return (
        <div
          key={employeeNumber}
          className={`rounded-lg border px-4 py-3 shadow-sm bg-white ${
            hasErrors
              ? 'border-red-300'
              : node.orphanReason
                ? 'border-amber-300'
                : 'border-gray-200'
          }`}
        >
          <p className="text-sm font-semibold text-gray-900 truncate" title={fullName}>
            {fullName || 'Sin nombre'}
          </p>
          <p className="text-xs text-gray-500 mb-2">No. {employeeNumber}</p>

          <div className="flex flex-wrap gap-1">
            {assignedRole ? (
              <span className="inline-block px-2 py-0.5 text-[11px] font-medium text-indigo-700 bg-indigo-100 rounded-full">
                {assignedRole.name}
              </span>
            ) : (
              <span className="inline-block px-2 py-0.5 text-[11px] font-medium text-gray-500 bg-gray-100 rounded-full">
                Sin rol asignado
              </span>
            )}
            {hasErrors && (
              <span
                className="inline-block px-2 py-0.5 text-[11px] font-medium text-red-700 bg-red-100 rounded-full"
                title={data.validationErrors.join('\n')}
              >
                {data.validationErrors.length} error(es)
              </span>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

/**
 * Sidebar list for rows whose employee number was missing and therefore could not
 * be placed inside the tree. These rows will still be rejected by the backend.
 */
const UnidentifiedList = ({ rows }: { rows: PreviewEmployee[] }) => (
  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
    <p className="text-sm font-semibold text-amber-800">
      Filas sin número de empleado ({rows.length})
    </p>
    <p className="text-xs text-amber-700">
      No pueden incluirse en el organigrama ni importarse. Corrige el archivo y vuelve
      a subirlo.
    </p>
    <ul className="text-xs text-amber-800 list-disc pl-5 space-y-1">
      {rows.map((row) => (
        <li key={`row-${row.row}`}>
          Fila {row.row}: {row.name || 'Sin nombre'}{' '}
          {row.lastName ? row.lastName : ''}
        </li>
      ))}
    </ul>
  </div>
);

export default OrgChart;
