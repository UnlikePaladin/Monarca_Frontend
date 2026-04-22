/**
 * Description: Component to display the current user's active substitute delegations with a cancel action.
 */
import React, { useState } from "react";
import { useGetSubstitutes } from "../../hooks/substitutes/useGetSubstitutes";
import { useDeleteSubstitute } from "../../hooks/substitutes/useDeleteSubstitute";
import { useGetUsers } from "../../hooks/users/useGetUsers";
import { toast } from "react-toastify";
import { ConfirmationModal } from "../ui/ConfirmationModal";

/**
 * Formats an ISO date string to a human-readable short date in Spanish.
 * @param isoDate ISO date string in YYYY-MM-DD format.
 * @returns Localized date string.
 */
const formatDate = (isoDate: string): string =>
  new Date(isoDate).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/**
 * Renders the list of active substitute delegations for the current user.
 * Each item displays the delegate, date range, optional notes, and a cancel button.
 * @returns React component with the active delegations list.
 */
export const ActiveDelegationsList = () => {
  const { data: substitutes, isLoading: isLoadingSubstitutes } =
    useGetSubstitutes();
  const { data: users = [] } = useGetUsers();
  const { mutate: deleteSubstitute, isPending } = useDeleteSubstitute();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  /**
   * Opens the confirmation modal before cancelling an active delegation.
   * @param substituteId The unique identifier of the delegation to cancel.
   */
  const handleCancelClick = (substituteId: string) => {
    setPendingDeleteId(substituteId);
    setConfirmOpen(true);
  };

  /**
   * Executes the delegation cancellation after the user confirms in the modal.
   */
  const handleConfirmCancel = () => {
    if (!pendingDeleteId) return;
    setConfirmOpen(false);
    deleteSubstitute(pendingDeleteId, {
      onSuccess: () => toast.success("Delegación cancelada correctamente."),
      onError: () => toast.error("Error al cancelar la delegación."),
      onSettled: () => setPendingDeleteId(null),
    });
  };

  const userNameMap = React.useMemo(() => {
    return users.reduce<Record<string, string>>((acc, user) => {
      acc[user.id] = `${user.name} ${user.lastName}`;
      return acc;
    }, {});
  }, [users]);

  if (isLoadingSubstitutes) {
    return (
      <p className="text-sm text-gray-500 py-4">Cargando delegaciones...</p>
    );
  }

  if (!substitutes || substitutes.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-400">
        Sin delegaciones activas.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700">
        Delegaciones Activas
      </h4>
      {substitutes.map((sub) => (
        <div
          key={sub.id}
          className="flex items-start justify-between gap-4 bg-white border border-gray-200 rounded-lg p-4"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-800">
              {userNameMap[sub.targetUserId] ?? sub.targetUserId}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(sub.startDate)} → {formatDate(sub.endDate)}
            </p>
            {sub.notes && (
              <p className="text-xs text-gray-400 italic">{sub.notes}</p>
            )}
          </div>
          <button
            onClick={() => handleCancelClick(sub.id)}
            disabled={isPending && pendingDeleteId === sub.id}
            className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
          >
            {isPending && pendingDeleteId === sub.id
              ? "Cancelando..."
              : "Cancelar"}
          </button>
        </div>
      ))}
      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancelar delegación"
        description="¿Estás seguro de que deseas cancelar esta delegación activa?"
        confirmText="Cancelar delegación"
        cancelText="Volver"
        isDestructive
        warningNote="Esta acción es irreversible. El sustituto perderá acceso inmediatamente."
      />
    </div>
  );
};

/*
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 * - 2026-04-16 | Juan de Dios Gastélum Flores | Replaced hardcoded USER_NAMES with dynamic lookup via useGetUsers.
 * - 2026-04-21 | Juan de Dios Gastélum Flores | Added ConfirmationModal before delegation cancellation.
 */
