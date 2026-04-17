/**
 * Description: Form component to create or edit a role, including its permission matrix.
 *              Operates in create mode when no role prop is provided, and edit mode otherwise.
 */

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Role, ModulePermission } from "../../types/auth";
import { AuthorizationMatrix } from "../AuthorizationMatrix";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import FieldError from "../ui/FieldError";
import { useCreateRole } from "../../hooks/roles/useCreateRole";
import { useUpdateRole } from "../../hooks/roles/useUpdateRole";
import { toast } from "react-toastify";

const roleFormSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(50, "El nombre no puede superar los 50 caracteres"),
  description: z
    .string()
    .min(1, "La descripción es requerida")
    .max(200, "La descripción no puede superar los 200 caracteres"),
  isActive: z.boolean(),
});

type RoleFormData = z.infer<typeof roleFormSchema>;

interface RoleFormProps {
  role?: Role;
  onClose: () => void;
}

/**
 * Renders a form to create or edit a role, including name, description, and permission matrix.
 * @param role Optional existing role; when provided the form operates in edit mode.
 * @param onClose Callback triggered when the form is cancelled or successfully submitted.
 * @returns React component with the role form.
 */
export const RoleForm = ({ role, onClose }: RoleFormProps) => {
  const isEditMode = !!role;
  const [permissions, setPermissions] = useState<ModulePermission[]>(
    role?.permissions ?? [],
  );

  useEffect(() => {
    setPermissions(role?.permissions ?? []);
  }, [role]);

  const { mutate: createRole, isPending: isCreating } = useCreateRole();
  const { mutate: updateRole, isPending: isUpdating } = useUpdateRole();
  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: role?.name ?? "",
      description: role?.description ?? "",
      isActive: role?.isActive ?? true,
    },
  });

  /**
   * Handles form submission by calling the appropriate mutation based on the current mode.
   * @param formData Validated form data from React Hook Form.
   */
  const onSubmit = (formData: RoleFormData) => {
    const payload = { ...formData, permissions };

    if (isEditMode) {
      updateRole(
        { roleId: role.id, data: payload },
        {
          onSuccess: () => {
            toast.success("Rol actualizado correctamente.");
            onClose();
          },
          onError: () => toast.error("Error al actualizar el rol."),
        },
      );
    } else {
      createRole(payload, {
        onSuccess: () => {
          toast.success("Rol creado correctamente.");
          onClose();
        },
        onError: () => toast.error("Error al crear el rol."),
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-6">
        {isEditMode ? "Editar Rol" : "Nuevo Rol"}
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <Input {...register("name")} placeholder="Ej. Aprobador" />
          {errors.name && <FieldError msg={errors.name.message} />}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <Input
            {...register("description")}
            placeholder="Breve descripción de este rol"
          />
          {errors.description && (
            <FieldError msg={errors.description.message} />
          )}
        </div>

        <div className="flex items-center gap-3 py-2">
          <input
            id="isActive"
            type="checkbox"
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            {...register("isActive")}
          />
          <label
            htmlFor="isActive"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            Rol activo
          </label>
        </div>

        <div className="pt-2">
          <AuthorizationMatrix
            initialPermissions={permissions}
            onSave={setPermissions}
            autoSave={true}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            Cancelar
          </button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending
              ? "Guardando..."
              : isEditMode
                ? "Guardar Cambios"
                : "Crear Rol"}
          </Button>
        </div>
      </form>
    </div>
  );
};

/*
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 */
