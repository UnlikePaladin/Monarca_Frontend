/**
 * Description: Component to display the current user's active substitute delegations with a cancel action.
 */

import React from 'react';
import { useGetSubstitutes } from '../../hooks/substitutes/useGetSubstitutes';
import { useDeleteSubstitute } from '../../hooks/substitutes/useDeleteSubstitute';

// Maps user IDs to display names during the mock stage; replace with a users lookup when API is ready.
const USER_NAMES: Record<string, string> = {
  usr_1: 'Ana Silva (Finanzas)',
  usr_2: 'Carlos Mendoza (Operaciones)',
};

/**
 * Formats an ISO date string to a human-readable short date in Spanish.
 * @param isoDate ISO date string in YYYY-MM-DD format.
 * @returns Localized date string.
 */
const formatDate = (isoDate: string): string =>
  new Date(isoDate).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

/**
 * Renders the list of active substitute delegations for the current user.
 * Each item displays the delegate, date range, optional notes, and a cancel button.
 * @returns React component with the active delegations list.
 */
export const ActiveDelegationsList = () => {
  const { data: substitutes, isLoading } = useGetSubstitutes();
  const { mutate: deleteSubstitute, isPending } = useDeleteSubstitute();

  if (isLoading) {
    return <p className="text-sm text-gray-500 py-4">Cargando delegaciones...</p>;
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
      <h4 className="text-sm font-semibold text-gray-700">Delegaciones Activas</h4>
      {substitutes.map((sub) => (
        <div
          key={sub.id}
          className="flex items-start justify-between gap-4 bg-white border border-gray-200 rounded-lg p-4"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-800">
              {USER_NAMES[sub.targetUserId] ?? sub.targetUserId}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(sub.startDate)} → {formatDate(sub.endDate)}
            </p>
            {sub.notes && (
              <p className="text-xs text-gray-400 italic">{sub.notes}</p>
            )}
          </div>
          <button
            onClick={() => deleteSubstitute(sub.id)}
            disabled={isPending}
            className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      ))}
    </div>
  );
};

/*
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 */
