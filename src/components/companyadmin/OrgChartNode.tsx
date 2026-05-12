/**
 * File: OrgChartNode.tsx
 * Description: Recursive node of the organization chart. Renders an employee card
 *              and its children below, connected by simple CSS lines.
 */

import { AvailableRole } from '../../types/importEmployees';
import { TreeNode } from '../../utils/flatToTree';

type OrgChartNodeProps = {
  node: TreeNode;
  roleByEmpNo: Record<string, string>;
  rolesById: Map<string, AvailableRole>;
};

const orphanLabel: Record<NonNullable<TreeNode['orphanReason']>, string> = {
  bossNotInFile: 'Jefe no incluido en el archivo',
  cycleBroken: 'Ciclo detectado, promovido a raíz',
};

/**
 * Renders one employee card plus its children tree. Cards above are connected to the
 * children container with a vertical line and each child has a short connector stub.
 */
const OrgChartNode = ({ node, roleByEmpNo, rolesById }: OrgChartNodeProps) => {
  const { data, children, employeeNumber } = node;
  const fullName = `${data.name}${data.lastName ? ` ${data.lastName}` : ''}`.trim();
  const assignedRoleId = roleByEmpNo[employeeNumber];
  const assignedRole = assignedRoleId ? rolesById.get(assignedRoleId) : undefined;
  const hasErrors = data.validationErrors.length > 0;

  return (
    <li className="flex flex-col items-center">
      <div
        className={`relative w-56 rounded-xl border px-4 py-3 text-left shadow-sm bg-white ${
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
        <p className="text-xs text-gray-500">No. {employeeNumber}</p>

        <div className="mt-2 flex flex-wrap gap-1">
          {assignedRole ? (
            <span className="inline-block px-2 py-0.5 text-[11px] font-medium text-indigo-700 bg-indigo-100 rounded-full">
              {assignedRole.name}
            </span>
          ) : (
            <span className="inline-block px-2 py-0.5 text-[11px] font-medium text-gray-500 bg-gray-100 rounded-full">
              Sin rol asignado
            </span>
          )}
          {data.isUpdate && (
            <span className="inline-block px-2 py-0.5 text-[11px] font-medium text-amber-700 bg-amber-100 rounded-full">
              Actualiza
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
          {node.orphanReason && (
            <span
              className="inline-block px-2 py-0.5 text-[11px] font-medium text-amber-700 bg-amber-50 rounded-full border border-amber-200"
              title={orphanLabel[node.orphanReason]}
            >
              {orphanLabel[node.orphanReason]}
            </span>
          )}
        </div>
      </div>

      {children.length > 0 && (
        <>
          <span className="w-px h-6 bg-gray-300" aria-hidden="true" />
          <ul className="relative flex items-start gap-6 pt-0">
            <span
              className="absolute top-0 left-0 right-0 h-px bg-gray-300"
              aria-hidden="true"
            />
            {children.map((child) => (
              <li
                key={child.employeeNumber}
                className="relative flex flex-col items-center pt-6"
              >
                <span
                  className="absolute top-0 left-1/2 w-px h-6 bg-gray-300 -translate-x-1/2"
                  aria-hidden="true"
                />
                <OrgChartNode
                  node={child}
                  roleByEmpNo={roleByEmpNo}
                  rolesById={rolesById}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </li>
  );
};

export default OrgChartNode;
