/**
 * File: ImportPreviewTable.tsx
 * Description: Tabular view of the parsed employees. Each row shows key Excel fields
 *              and a per-row role Select that feeds roleByEmpNo in the parent.
 */

import { useMemo } from 'react';
import Select from '../ui/Select';
import {
  AvailableRole,
  PreviewEmployee,
} from '../../types/importEmployees';

type ImportPreviewTableProps = {
  employees: PreviewEmployee[];
  availableRoles: AvailableRole[];
  roleByEmpNo: Record<string, string>;
  onRoleChange: (employeeNumber: string, roleId: string) => void;
};

/**
 * Renders the dual "Tabla" view of the preview with role assignment dropdowns.
 */
const ImportPreviewTable = ({
  employees,
  availableRoles,
  roleByEmpNo,
  onRoleChange,
}: ImportPreviewTableProps) => {
  const roleOptions = useMemo(
    () => (availableRoles || []).map((role) => ({ id: role.id, name: role.name })),
    [availableRoles],
  );

  const findOption = (roleId: string | undefined) =>
    roleOptions.find((option) => option.id === roleId) ?? null;

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
          <tr>
            <th className="px-3 py-3 text-left">Fila</th>
            <th className="px-3 py-3 text-left">No. Empleado</th>
            <th className="px-3 py-3 text-left">Nombre</th>
            <th className="px-3 py-3 text-left">Usuario</th>
            <th className="px-3 py-3 text-left">Correo (login)</th>
            <th className="px-3 py-3 text-left">CeCo / Depto.</th>
            <th className="px-3 py-3 text-left">Jefe inmediato</th>
            <th className="px-3 py-3 text-left">Status</th>
            <th className="px-3 py-3 text-left min-w-[220px]">Rol asignado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {(employees || []).length === 0 && (
            <tr>
              <td
                colSpan={9}
                className="px-3 py-6 text-center text-gray-400 text-sm"
              >
                No hay empleados en el archivo.
              </td>
            </tr>
          )}
          {(employees || []).map((employee) => {
            const hasErrors = employee.validationErrors.length > 0;
            const fullName = `${employee.name}${
              employee.lastName ? ` ${employee.lastName}` : ''
            }`.trim();
            const selectedRoleId = roleByEmpNo[employee.employeeNumber];
            const selectedOption = findOption(selectedRoleId);

            return (
              <tr
                key={`${employee.employeeNumber || 'row'}-${employee.row}`}
                className={hasErrors ? 'bg-red-50/50' : ''}
              >
                <td className="px-3 py-2 text-gray-500">{employee.row}</td>
                <td className="px-3 py-2 font-medium text-gray-800">
                  {employee.employeeNumber || '—'}
                </td>
                <td className="px-3 py-2 text-gray-800">{fullName || '—'}</td>
                <td className="px-3 py-2 text-gray-600">
                  {employee.username ?? '—'}
                </td>
                <td className="px-3 py-2 text-gray-600">
                  {employee.email ?? '—'}
                </td>
                <td className="px-3 py-2 text-gray-600">
                  {employee.departmentName ?? 'Sin departamento'}
                </td>
                <td className="px-3 py-2 text-gray-600">
                  {employee.bossEmployeeNumber ?? '—'}
                </td>
                <td className="px-3 py-2 text-gray-600 capitalize">
                  {employee.availabilityStatus}
                </td>
                <td className="px-3 py-2">
                  <Select
                    options={roleOptions}
                    value={selectedOption}
                    onChange={(option) =>
                      onRoleChange(
                        employee.employeeNumber,
                        String(option.id),
                      )
                    }
                    isDisabled={hasErrors || !employee.employeeNumber}
                    placeholder={
                      hasErrors ? 'Corrige errores primero' : 'Selecciona un rol'
                    }
                    id={`role-${employee.employeeNumber || employee.row}`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ImportPreviewTable;
