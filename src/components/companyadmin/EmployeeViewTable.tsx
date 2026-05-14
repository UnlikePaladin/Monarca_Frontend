/**
 * File: EmployeeViewTable.tsx
 * Description: Read-only table view of imported employees showing their assigned roles.
 *              Unlike ImportPreviewTable, this is view-only and displays the role name
 *              instead of offering a dropdown to change roles.
 */

interface Employee {
  row: number;
  employeeNumber: string;
  name: string;
  lastName: string;
  username: string | null;
  email: string | null;
  departmentName?: string | null;
  bossEmployeeNumber: string | null;
  availabilityStatus: string;
  roleName?: string;
}

type EmployeeViewTableProps = {
  employees: Employee[];
};

const EmployeeViewTable = ({ employees }: EmployeeViewTableProps) => {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
          <tr>
            <th className="px-3 py-3 text-left">No. Empleado</th>
            <th className="px-3 py-3 text-left">Nombre</th>
            <th className="px-3 py-3 text-left">Usuario</th>
            <th className="px-3 py-3 text-left">Correo</th>
            <th className="px-3 py-3 text-left">Departamento</th>
            <th className="px-3 py-3 text-left">Jefe inmediato</th>
            <th className="px-3 py-3 text-left">Estado</th>
            <th className="px-3 py-3 text-left">Rol asignado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {(employees || []).length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="px-3 py-6 text-center text-gray-400 text-sm"
              >
                No hay empleados registrados.
              </td>
            </tr>
          )}
          {(employees || []).map((employee) => {
            const fullName = `${employee.name}${
              employee.lastName ? ` ${employee.lastName}` : ''
            }`.trim();

            return (
              <tr key={`${employee.employeeNumber}-${employee.row}`}>
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
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {employee.roleName || 'Sin rol'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeViewTable;
