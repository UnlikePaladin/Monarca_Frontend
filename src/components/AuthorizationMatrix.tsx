/**
 * Description: Component to display and edit granular permissions across different modules.
 */

import React, { useState } from 'react';
import { Button } from './ui/Button';
import { ActionType, ModulePermission } from './../types/auth';

const ACTIONS: { key: ActionType; label: string }[] = [
  { key: 'create', label: 'Crear' },
  { key: 'read', label: 'Leer' },
  { key: 'update', label: 'Actualizar' },
  { key: 'delete', label: 'Eliminar' },
  { key: 'approve', label: 'Aprobar' },
];

const MOCK_MODULES = [
  { id: 'mod_travel', name: 'Solicitudes de Viaje' },
  { id: 'mod_refunds', name: 'Reembolsos' },
  { id: 'mod_bookings', name: 'Reservaciones' },
];

interface AuthorizationMatrixProps {
  initialPermissions?: ModulePermission[];
  onSave: (permissions: ModulePermission[]) => void;
  autoSave?: boolean;
}

const buildInitialMap = (permissions: ModulePermission[]): Record<string, ActionType[]> =>
  permissions.reduce<Record<string, ActionType[]>>((acc, p) => {
    acc[p.moduleId] = p.allowedActions;
    return acc;
  }, {});

/**
 * Renders an authorization matrix to toggle module permissions.
 * @param initialPermissions Initial array of allowed permissions.
 * @param onSave Callback triggered when the matrix is saved.
 * @param autoSave When true, notifies the parent on every checkbox change and hides the save button.
 * @returns React component with the permission matrix.
 */
export const AuthorizationMatrix = ({ initialPermissions = [], onSave, autoSave = false }: AuthorizationMatrixProps) => {
  const [permissionsMap, setPermissionsMap] = useState<Record<string, ActionType[]>>(
    () => buildInitialMap(initialPermissions)
  );

  /**
   * Toggles an action for a specific module inside the permissions map.
   * @param moduleId The unique identifier of the module.
   * @param action The action type to be toggled.
   */
  const handleToggle = (moduleId: string, action: ActionType) => {
    setPermissionsMap((prevMap) => {
      const currentActions = prevMap[moduleId] || [];
      const hasAction = currentActions.includes(action);
      const updated = {
        ...prevMap,
        [moduleId]: hasAction
          ? currentActions.filter((a) => a !== action)
          : [...currentActions, action],
      };

      if (autoSave) {
        const payload: ModulePermission[] = MOCK_MODULES.map((m) => ({
          moduleId: m.id,
          moduleName: m.name,
          allowedActions: updated[m.id] || [],
        }));
        onSave(payload);
      }

      return updated;
    });
  };

  /**
   * Transforms the current map to an array payload and triggers the save callback.
   */
  const handleSave = () => {
    const payload: ModulePermission[] = MOCK_MODULES.map((moduleItem) => ({
      moduleId: moduleItem.id,
      moduleName: moduleItem.name,
      allowedActions: permissionsMap[moduleItem.id] || [],
    }));
    onSave(payload);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Matriz de Permisos</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 px-4 text-gray-600 font-medium">Módulo</th>
              {ACTIONS.map((action) => (
                <th key={action.key} className="py-3 px-4 text-center text-gray-600 font-medium">
                  {action.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_MODULES.map((moduleItem) => (
              <tr key={moduleItem.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-4 font-medium text-gray-800">{moduleItem.name}</td>
                {ACTIONS.map((action) => (
                  <td key={action.key} className="py-4 px-4 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                      checked={(permissionsMap[moduleItem.id] || []).includes(action.key)}
                      onChange={() => handleToggle(moduleItem.id, action.key)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!autoSave && (
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} className="bg-blue-600 text-white hover:bg-blue-700">
            Guardar Matriz
          </Button>
        </div>
      )}
    </div>
  );
};

/**
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 */
