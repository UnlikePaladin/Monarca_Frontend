/*
  ConfirmationModal.tsx
  Reusable confirmation modal component for irreversible or critical user actions.
  Displays a title, description, optional warning note, and confirm/cancel buttons.
  Supports a destructive variant (red) and a standard warning variant (yellow).
*/

import React from "react";
import {
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

/** Props for the ConfirmationModal component. */
interface ConfirmationModalProps {
  /** Controls modal visibility. */
  isOpen: boolean;
  /** Called when the user dismisses the modal without confirming. */
  onClose: () => void;
  /** Called when the user confirms the action. */
  onConfirm: () => void;
  /** Short title displayed at the top of the modal. */
  title: string;
  /** Contextual description of the action being confirmed. */
  description: string;
  /** Label for the confirm button. Defaults to "Confirmar". */
  confirmText?: string;
  /** Label for the cancel button. Defaults to "Cancelar". */
  cancelText?: string;
  /** When true, renders the modal in red (destructive/irreversible action). */
  isDestructive?: boolean;
  /** When true, disables both buttons and shows "Procesando..." on confirm. */
  isLoading?: boolean;
  /** Optional irreversibility warning rendered in a highlighted banner. */
  warningNote?: string;
}

/**
 * Renders a centered overlay modal asking the user to confirm an action.
 * Use for any action that is irreversible or has significant side effects.
 * @param props - See ConfirmationModalProps.
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDestructive = false,
  isLoading = false,
  warningNote,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop — clicking it dismisses the modal */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div
            className={`flex-shrink-0 p-2 rounded-full ${
              isDestructive ? "bg-red-100" : "bg-yellow-100"
            }`}
          >
            <ExclamationTriangleIcon
              className={`h-6 w-6 ${
                isDestructive ? "text-red-600" : "text-yellow-600"
              }`}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>

        {warningNote && (
          <div
            className={`mb-5 px-4 py-3 rounded-lg text-sm border ${
              isDestructive
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-yellow-50 text-yellow-800 border-yellow-200"
            }`}
          >
            ⚠️ <span className="font-medium">{warningNote}</span>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
              isDestructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[var(--blue)] hover:bg-[var(--dark-blue)]"
            }`}
          >
            {isLoading ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

/*
Modification History:
- 2026-04-18 | Juan de Dios Gastélum Flores | Initial file creation. Reusable confirmation modal for irreversible actions.
*/