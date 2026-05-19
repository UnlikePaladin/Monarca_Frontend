/**
 * PolicyAlert.tsx
 * UI Component to display blocking and warning violations from the policy engine.
 */
import { ShieldExclamationIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import formatMoney from "../../utils/formatMoney";

interface Violation {
  policy_code: string;
  message: string;
  severity: 'BLOCKING' | 'WARNING';
  evaluated_value?: any;
}
/**
 * Renders a list of policy violations with specific styles based on severity.
 * @param violations Array of violation objects from the backend
 */
export const PolicyAlert = ({ violations }: { violations: Violation[] }) => {
  if (!violations|| !Array.isArray(violations) || violations.length === 0) return null;

  return (
    <div className="mt-6 space-y-3 animate-fade-in" id="policy-alerts-container">
      <div className="flex items-center gap-2 mb-2 border-b border-gray-200 pb-2">
        <ShieldExclamationIcon className="h-5 w-5 text-gray-500" />
        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-tight">
          Validacion del Motor de Politicas
        </h4>
      </div>
      
      {violations.map((v, index) => {
        const safeMessage = typeof v.message === "string" ? v.message : "";
        const rowMatch = safeMessage.match(/^\[Fila\s+(\d+)\]\s*(.*)$/);
        const rowLabel = rowMatch ? `Fila ${rowMatch[1]}` : null;
        const displayMessage = rowMatch ? rowMatch[2] : safeMessage;
        const rawAmount = v.evaluated_value?.amount_mxn ?? v.evaluated_value?.amount;
        const numericAmount = Number(rawAmount);
        const hasAmount = Number.isFinite(numericAmount);

        return (
        <div 
          key={index} 
          className={`p-4 rounded-lg border-l-4 shadow-sm transition-all ${
            v.severity === 'BLOCKING' 
              ? 'bg-red-50 border-red-500 text-red-900' 
              : 'bg-orange-50 border-orange-400 text-orange-900'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              {v.severity === 'BLOCKING' ? (
                <XCircleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
              ) : (
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-500 flex-shrink-0" />
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {rowLabel && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase bg-white/70 border border-current/10">
                      {rowLabel}
                    </span>
                  )}
                  <p className="text-sm font-bold leading-snug">{displayMessage}</p>
                </div>
                {hasAmount && (
                  <p className="text-xs text-gray-700 mt-1">
                    Monto evaluado: {formatMoney(numericAmount)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase bg-white/50 border border-current/10">
                {v.severity}
              </span>
            </div>
          </div>
        </div>
      );
      })}
    </div>
  );
};

/*
Modification History:
2026-04-11 | Fabrizio | Created component to display policy engine results with severity-based styling.
*/