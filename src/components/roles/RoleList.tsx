/**
 * Description: Component to display the list of system roles with edit and delete actions.
 */

import React, { useState } from "react";
import { Role } from "../../types/auth";
import { Button } from "../ui/Button";
import { useGetRoles } from "../../hooks/roles/useGetRoles";
import { useDeleteRole } from "../../hooks/roles/useDeleteRole";
import { toast } from "react-toastify";
import { ConfirmationModal } from "../ui/ConfirmationModal";

interface RoleListProps {
  onEdit: (role: Role) => void;
  onCreate: () => void;
}

/**
 * Renders a table of all roles with options to create, edit, or delete each one.
 * @param onEdit Callback triggered when the user selects a role to edit.
 * @param onCreate Callback triggered when the user wants to create a new role.
 * @returns React component with the roles table.
 */
export const RoleList = ({ onEdit, onCreate }: RoleListProps) => {
  const { data: roles, isLoading } = useGetRoles();
  const { mutate: deleteRole, isPending: isDeleting } = useDeleteRole();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string>("");

  /**
   * Opens the confirmation modal before permanently deleting a role.
   * @param roleId The unique identifier of the role to delete.
   * @param roleName The role name shown in the confirmation modal.
   */
  const handleDelete = (roleId: string, roleName: string) => {
    setPendingDeleteId(roleId);
    setPendingDeleteName(roleName);
    setConfirmOpen(true);
  };

  /**
   * Executes the role deletion after the user confirms in the modal.
   */
  const handleConfirmDelete = () => {
    if (!pendingDeleteId) return;
    setConfirmOpen(false);
    setDeletingId(pendingDeleteId);
    deleteRole(pendingDeleteId, {
      onSuccess: () => toast.success("Rol eliminado correctamente."),
      onError: () => toast.error("Error al eliminar el rol."),
      onSettled: () => {
        setDeletingId(null);
        setPendingDeleteId(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12 text-gray-500 text-sm">
        Cargando roles...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Roles</h3>
        <Button
          onClick={onCreate}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          + Nuevo Rol
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="py-3 px-6 text-sm font-medium text-gray-600">
                Nombre
              </th>
              <th className="py-3 px-6 text-sm font-medium text-gray-600">
                Descripción
              </th>
              <th className="py-3 px-6 text-sm font-medium text-gray-600 text-center">
                Estado
              </th>
              <th className="py-3 px-6 text-sm font-medium text-gray-600 text-center">
                Permisos
              </th>
              <th className="py-3 px-6 text-sm font-medium text-gray-600 text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {roles?.map((role) => (
              <tr
                key={role.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-6 font-medium text-gray-800">
                  {role.name}
                </td>
                <td className="py-4 px-6 text-gray-600 text-sm">
                  {role.description}
                </td>
                <td className="py-4 px-6 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      role.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {role.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="py-4 px-6 text-center text-sm text-gray-600">
                  {role.permissions.length} módulos
                </td>
                <td className="py-4 px-6">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onEdit(role)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Editar
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => handleDelete(role.id, role.name)}
                      disabled={isDeleting && deletingId === role.id}
                      className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      {isDeleting && deletingId === role.id
                        ? "Eliminando..."
                        : "Eliminar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {roles?.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-gray-400 text-sm"
                >
                  Sin roles. Crea el primero para comenzar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar rol"
        description={`¿Estás seguro de que deseas eliminar el rol "${pendingDeleteName}"?`}
        confirmText="Eliminar"
        isDestructive
        warningNote="Esta acción es irreversible. El rol será eliminado permanentemente."
      />
    </div>
  );
};

/*
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 * - 2026-04-21 | Juan de Dios Gastélum Flores | Replaced native confirm() with ConfirmationModal for role deletion.
 */
