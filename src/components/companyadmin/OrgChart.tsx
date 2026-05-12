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
    for (const role of availableRoles) {
      map.set(role.id, role);
    }
    return map;
  }, [availableRoles]);

  if (tree.roots.length === 0 && tree.unidentified.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-500">
        No hay datos para construir el organigrama.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 overflow-x-auto">
        <ul className="flex items-start gap-10 min-w-max">
          {tree.roots.map((root) => (
            <OrgChartNode
              key={root.employeeNumber}
              node={root}
              roleByEmpNo={roleByEmpNo}
              rolesById={rolesById}
            />
          ))}
        </ul>
      </div>

      {tree.unidentified.length > 0 && (
        <UnidentifiedList rows={tree.unidentified} />
      )}
    </div>
  );
};

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
