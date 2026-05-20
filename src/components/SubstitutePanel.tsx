/**
 * Description: Component to configure temporary role delegations to another user.
 */

import React, { useState } from "react";
import dayjs from "dayjs";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import Select from "./ui/Select";
import FieldError from "./ui/FieldError";
import { useAuth } from "../hooks/auth/authContext";
import { useGetApprovers } from "../hooks/users/useGetApprovers";
import { useCreateSubstitute } from "../hooks/substitutes/useCreateSubstitute";
import { toast } from "react-toastify";
import { AxiosError } from "axios";

interface FormData {
  targetUserId: string;
  startDate: string;
  endDate: string;
  notes: string;
}

const todayDateString = () => dayjs().format("YYYY-MM-DD");

const getDelegationErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string" && message.trim()) return message;
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Ocurrió un error al activar la delegación. Intenta de nuevo.";
};

/**
 * Renders a form to select a substitute user and date range for delegations.
 * @returns React component containing the delegation form.
 */
export const SubstitutePanel = () => {
  const { authState } = useAuth();
  const { data: users = [], isLoading: isLoadingUsers } = useGetApprovers();
  const { mutate: createSubstitute, isPending } = useCreateSubstitute();

  const [formData, setFormData] = useState<FormData>({
    targetUserId: "",
    startDate: "",
    endDate: "",
    notes: "",
  });
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const userOptions = users
    .filter((user) => user.id !== authState.userId)
    .map((user) => ({
      id: user.id,
      name: `${user.name} ${user.lastName}`,
    }));

  /**
   * Validates form dates and submits the delegation request.
   * @param event The form submission event.
   */
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");

    if (!formData.targetUserId) {
      setErrorMessage("Selecciona un usuario sustituto.");
      return;
    }

    const start = dayjs(formData.startDate);
    const end = dayjs(formData.endDate);
    const today = dayjs().startOf("day");

    if (start.isBefore(today)) {
      setErrorMessage("La fecha de inicio no puede ser anterior a hoy.");
      return;
    }

    if (end.isBefore(start)) {
      setErrorMessage(
        "La fecha de fin no puede ser anterior a la fecha de inicio.",
      );
      return;
    }

    createSubstitute(
      {
        originalUserId: authState.userId,
        targetUserId: formData.targetUserId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        roleId: authState.userRoleId || undefined,
        ...(formData.notes.trim() ? { notes: formData.notes.trim() } : {}),
      },
      {
        onSuccess: () => {
          toast.success("Delegación activada correctamente.");
          setFormData({
            targetUserId: "",
            startDate: "",
            endDate: "",
            notes: "",
          });
          setSelectedUser(null);
        },
        onError: (error) => {
          const message = getDelegationErrorMessage(error);
          setErrorMessage(message);
          toast.error(message);
        },
      },
    );
  };

  return (
    <div className="max-w-md bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">
        Configurar Sustituto Temporal
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Delega tus permisos de aprobación a otro usuario durante tu ausencia.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Usuario Sustituto
          </label>
          <Select
            options={userOptions}
            value={selectedUser}
            placeholder={
              isLoadingUsers ? "Cargando usuarios..." : "Seleccionar usuario..."
            }
            onChange={(option) => {
              setSelectedUser({ id: String(option.id), name: option.name });
              setFormData({ ...formData, targetUserId: String(option.id) });
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inicio
            </label>
            <Input
              type="date"
              value={formData.startDate}
              min={todayDateString()}
              onChange={(event) =>
                setFormData({ ...formData, startDate: event.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fin
            </label>
            <Input
              type="date"
              value={formData.endDate}
              min={formData.startDate || todayDateString()}
              onChange={(event) =>
                setFormData({ ...formData, endDate: event.target.value })
              }
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <Input
            type="text"
            value={formData.notes}
            placeholder="Motivo de la ausencia..."
            onChange={(event) =>
              setFormData({ ...formData, notes: event.target.value })
            }
          />
        </div>

        {errorMessage && <FieldError msg={errorMessage} />}

        <div className="pt-4">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Activando..." : "Activar Delegación"}
          </Button>
        </div>
      </form>
    </div>
  );
};

/**
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 * - 2026-04-16 | Juan de Dios Gastélum Flores | Connected to real API. Replaced mock users with useGetUsers. Connected useCreateSubstitute. Reads userRoleId from authContext.
 * - 2026-05-13 | Juan de Dios Gastélum | Replaced useGetUsers with useGetApprovers; excluded current user from options.
 */
