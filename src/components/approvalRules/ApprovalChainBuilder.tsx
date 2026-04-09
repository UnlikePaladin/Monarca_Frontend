/**
 * Description: Component to build the ordered approval chain levels for a rule.
 */

import React from 'react';
import { ApprovalLevel } from '../../types/approvalRules';

const MOCK_ROLES = [
  { id: 'role_1', name: 'Supervisor directo' },
  { id: 'role_2', name: 'Gerente de área' },
  { id: 'role_3', name: 'Director financiero' },
];

const SELECT_CLASS = 'w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer';

interface ApprovalChainBuilderProps {
  chain: ApprovalLevel[];
  onChange: (chain: ApprovalLevel[]) => void;
}

/**
 * Renders a builder for creating an ordered approval chain with quorum settings per level.
 * @param chain Current list of approval levels.
 * @param onChange Callback triggered when the chain is modified.
 * @returns React component with the approval chain builder.
 */
export const ApprovalChainBuilder = ({ chain, onChange }: ApprovalChainBuilderProps) => {

  /**
   * Adds a new approval level at the end of the chain.
   */
  const handleAdd = () => {
    onChange([...chain, {
      order: chain.length + 1,
      roleId: MOCK_ROLES[0].id,
      roleName: MOCK_ROLES[0].name,
      requiredApprovals: 1,
    }]);
  };

  /**
   * Removes the level at the given index and reorders remaining levels.
   * @param index Position of the level to remove.
   */
  const handleRemove = (index: number) => {
    onChange(
      chain
        .filter((_, i) => i !== index)
        .map((level, i) => ({ ...level, order: i + 1 }))
    );
  };

  /**
   * Moves a level up or down in the chain.
   * @param index Current position of the level.
   * @param direction Direction to move: 'up' or 'down'.
   */
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newChain = [...chain];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newChain[index], newChain[targetIndex]] = [newChain[targetIndex], newChain[index]];
    onChange(newChain.map((level, i) => ({ ...level, order: i + 1 })));
  };

  /**
   * Updates a specific field of the level at the given index.
   * @param index Position of the level to update.
   * @param updates Partial level data to merge.
   */
  const handleChange = (index: number, updates: Partial<ApprovalLevel>) => {
    onChange(chain.map((level, i) => {
      if (i !== index) return level;
      const merged = { ...level, ...updates };
      if (updates.roleId) {
        const role = MOCK_ROLES.find((r) => r.id === updates.roleId);
        if (role) merged.roleName = role.name;
      }
      return merged;
    }));
  };

  return (
    <div className="space-y-4">

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cadena de aprobación</label>
        <p className="text-xs text-gray-500">
          Define quién debe aprobar la solicitud y en qué orden. Los niveles se ejecutan de forma secuencial - el nivel 2 no inicia hasta que el nivel 1 esté completado.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700 space-y-1">
        <p><strong>Rol:</strong> puesto o perfil responsable de aprobar en ese nivel.</p>
        <p><strong>Mín. aprobaciones:</strong> cuántas personas con ese rol deben aprobar para avanzar al siguiente nivel. Útil cuando hay varios aprobadores con el mismo rol.</p>
        <p><strong>▲ ▼:</strong> cambia el orden de aprobación entre niveles.</p>
      </div>

      {chain.length === 0 && (
        <p className="text-sm text-gray-400 italic">Sin niveles - agrega al menos uno.</p>
      )}

      {chain.map((level, index) => (
        <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Nivel {level.order}
            </span>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleMove(index, 'up')}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs px-1.5 py-0.5 border border-gray-300 rounded"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={index === chain.length - 1}
                  onClick={() => handleMove(index, 'down')}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs px-1.5 py-0.5 border border-gray-300 rounded"
                >
                  ▼
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-red-400 hover:text-red-600 text-sm font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Rol</label>
            <select
              value={level.roleId}
              onChange={(e) => handleChange(index, { roleId: e.target.value })}
              className={SELECT_CLASS}
            >
              {MOCK_ROLES.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Mín. aprobaciones</label>
            <input
              type="number"
              min={1}
              value={level.requiredApprovals}
              onChange={(e) => handleChange(index, { requiredApprovals: Number(e.target.value) })}
              className="w-24 text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-center text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

        </div>
      ))}

      <button
        type="button"
        onClick={handleAdd}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        + Agregar nivel
      </button>
    </div>
  );
};

/*
 * Modification History:
 * - 2026-04-08 | Juan de Dios Gastélum Flores | Initial file creation.
 */
