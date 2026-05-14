/**
 * Description: Component to build the ordered approval chain levels for a rule.
 * Each level can be role-based or hierarchy-based (N levels up the manager chain).
 */

import React from "react";
import { ApprovalLevel, StepType } from "../../types/approvalRules";
import { useGetRoles } from "../../hooks/roles/useGetRoles";

const SELECT_CLASS =
  "w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer";
const INPUT_CLASS =
  "w-24 text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-center text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

interface ApprovalChainBuilderProps {
  chain: ApprovalLevel[];
  onChange: (chain: ApprovalLevel[]) => void;
}

const DEFAULT_ROLE_LEVEL: ApprovalLevel = {
  order: 1,
  stepType: "role",
  roleId: "",
  roleName: "",
  requiredApprovals: 1,
};

const DEFAULT_HIERARCHY_LEVEL: ApprovalLevel = {
  order: 1,
  stepType: "hierarchy",
  hierarchyLevel: 1,
  requiredApprovals: 1,
};

/**
 * Renders a builder for creating an ordered approval chain with quorum settings per level.
 * Each level can be configured as role-based or hierarchy-based.
 * @param chain Current list of approval levels.
 * @param onChange Callback triggered when the chain is modified.
 */
export const ApprovalChainBuilder = ({
  chain,
  onChange,
}: ApprovalChainBuilderProps) => {
  const { data: roles = [], isLoading: rolesLoading } = useGetRoles();

  /**
   * Adds a new role-based approval level at the end of the chain.
   */
  const handleAdd = () => {
    onChange([...chain, { ...DEFAULT_ROLE_LEVEL, order: chain.length + 1 }]);
  };

  /**
   * Removes the level at the given index and reorders remaining levels.
   * @param index Position of the level to remove.
   */
  const handleRemove = (index: number) => {
    onChange(
      chain
        .filter((_, i) => i !== index)
        .map((level, i) => ({ ...level, order: i + 1 })),
    );
  };

  /**
   * Moves a level up or down in the chain.
   * @param index Current position.
   * @param direction 'up' or 'down'.
   */
  const handleMove = (index: number, direction: "up" | "down") => {
    const newChain = [...chain];
    const target = direction === "up" ? index - 1 : index + 1;
    [newChain[index], newChain[target]] = [newChain[target], newChain[index]];
    onChange(newChain.map((level, i) => ({ ...level, order: i + 1 })));
  };

  /**
   * Updates a specific field of the level at the given index.
   * @param index Position of the level to update.
   * @param updates Partial level data to merge.
   */
  const handleChange = (index: number, updates: Partial<ApprovalLevel>) => {
    onChange(
      chain.map((level, i) => (i !== index ? level : { ...level, ...updates })),
    );
  };

  /**
   * Switches the step type of a level. Resets type-specific fields when switching.
   * @param index Position of the level.
   * @param stepType New step type to apply.
   */
  const handleStepTypeChange = (index: number, stepType: StepType) => {
    const base = {
      order: chain[index].order,
      stepType,
      requiredApprovals: chain[index].requiredApprovals,
    };
    const updated: ApprovalLevel =
      stepType === "hierarchy"
        ? { ...base, hierarchyLevel: 1 }
        : { ...base, roleId: "", roleName: "" };
    onChange(chain.map((level, i) => (i !== index ? level : updated)));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cadena de aprobación
        </label>
        <p className="text-xs text-gray-500">
          Define quién aprueba y en qué orden. Los niveles son secuenciales: el
          nivel 2 no inicia hasta que el nivel 1 esté aprobado.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700 space-y-1">
        <p>
          <strong>Por Rol:</strong> cualquier usuario con ese rol puede aprobar.
        </p>
        <p>
          <strong>Por Jerarquía:</strong> el manager a N niveles arriba del
          solicitante aprueba automáticamente.
        </p>
        <p>
          <strong>Mín. aprobaciones:</strong> cuántas personas deben aprobar
          para avanzar al siguiente nivel.
        </p>
      </div>

      {chain.length === 0 && (
        <p className="text-sm text-gray-400 italic">
          Sin niveles — agrega al menos uno.
        </p>
      )}

      {chain.map((level, index) => (
        <div
          key={index}
          className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Nivel {level.order}
            </span>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleMove(index, "up")}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs px-1.5 py-0.5 border border-gray-300 rounded"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={index === chain.length - 1}
                  onClick={() => handleMove(index, "down")}
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

          {/* Step type toggle */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Tipo de aprobación
            </label>
            <div className="flex gap-2">
              {(["role", "hierarchy"] as StepType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleStepTypeChange(index, type)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    level.stepType === type
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {type === "role" ? "Por Rol" : "Por Jerarquía"}
                </button>
              ))}
            </div>
          </div>

          {/* Role selector (stepType === 'role') */}
          {level.stepType === "role" && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rol</label>
              <select
                value={level.roleId ?? ""}
                disabled={rolesLoading}
                onChange={(e) => {
                  const selected = roles.find((r) => r.id === e.target.value);
                  handleChange(index, {
                    roleId: selected?.id ?? "",
                    roleName: selected?.name ?? "",
                  });
                }}
                className={SELECT_CLASS}
              >
                <option value="">
                  {rolesLoading ? "Cargando roles..." : "Selecciona un rol"}
                </option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Hierarchy level selector (stepType === 'hierarchy') */}
          {level.stepType === "hierarchy" && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Niveles arriba en la jerarquía
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={level.hierarchyLevel ?? 1}
                  onChange={(e) =>
                    handleChange(index, {
                      hierarchyLevel: Number(e.target.value),
                    })
                  }
                  className={INPUT_CLASS}
                />
                <span className="text-xs text-gray-500">
                  {level.hierarchyLevel === 1
                    ? "Jefe inmediato"
                    : `${level.hierarchyLevel} niveles arriba`}
                </span>
              </div>
            </div>
          )}

          {/* Min approvals */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Mín. aprobaciones
            </label>
            <input
              type="number"
              min={1}
              value={level.requiredApprovals}
              onChange={(e) =>
                handleChange(index, {
                  requiredApprovals: Number(e.target.value),
                })
              }
              className={INPUT_CLASS}
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
 * - 2026-04-08 | Juan de Dios Gastélum | Initial file creation.
 * - 2026-05-12 | Juan de Dios Gastélum | Added stepType toggle (role/hierarchy);
 *   added hierarchyLevel input; removed MOCK_ROLES.
 */
