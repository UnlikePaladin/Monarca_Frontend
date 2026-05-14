/**
 * Description: Form component to create or edit an approval rule.
 *              Operates in create mode when no rule prop is provided, and edit mode otherwise.
 */

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApprovalRule, RuleCondition } from "../../types/approvalRules";
import { ConditionBuilder } from "./ConditionBuilder";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import FieldError from "../ui/FieldError";
import { useCreateApprovalRule } from "../../hooks/approvalRules/useCreateApprovalRule";
import { useUpdateApprovalRule } from "../../hooks/approvalRules/useUpdateApprovalRule";

const MAX_HIERARCHY_LEVELS = 10;

const LEVEL_LABELS: Record<number, string> = {
  1: "Jefe inmediato",
  2: "Jefe del jefe",
};

const ruleFormSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede superar los 100 caracteres"),
  isActive: z.boolean(),
});

type RuleFormData = z.infer<typeof ruleFormSchema>;

interface RuleFormProps {
  rule?: ApprovalRule;
  onClose: () => void;
}

/**
 * Renders a form to create or edit an approval rule with conditions and hierarchy level selector.
 * @param rule Optional existing rule; when provided the form operates in edit mode.
 * @param onClose Callback triggered when the form is cancelled or successfully submitted.
 */
export const RuleForm = ({ rule, onClose }: RuleFormProps) => {
  const isEditMode = !!rule;

  const initialLevel =
    rule?.steps?.find((s) => s.stepType === "hierarchy")?.hierarchyLevel ?? 1;

  const [conditions, setConditions] = useState<RuleCondition[]>(
    rule?.conditions ?? [],
  );
  const [requiredLevels, setRequiredLevels] = useState<number>(initialLevel);

  const { mutate: createRule, isPending: isCreating } = useCreateApprovalRule();
  const { mutate: updateRule, isPending: isUpdating } = useUpdateApprovalRule();
  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RuleFormData>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      name: rule?.name ?? "",
      isActive: rule?.isActive ?? true,
    },
  });

  /**
   * Handles form submission. Maps the selected hierarchy level into a single steps array
   * compatible with the backend's CreateApprovalRuleDto.
   * @param formData Validated form data from React Hook Form.
   */
  const onSubmit = (formData: RuleFormData) => {
    const payload = {
      ...formData,
      conditions,
      steps: [
        {
          order: 1,
          stepType: "hierarchy" as const,
          hierarchyLevel: requiredLevels,
          minApprovals: 1,
        },
      ],
    };

    if (isEditMode) {
      updateRule({ ruleId: rule.id, data: payload }, { onSuccess: onClose });
    } else {
      createRule(payload, { onSuccess: onClose });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-6">
        {isEditMode ? "Editar Regla" : "Nueva Regla"}
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <Input
            {...register("name")}
            placeholder="Ej. Viaje internacional de alto costo"
          />
          {errors.name && <FieldError msg={errors.name.message} />}
        </div>

        <div className="flex items-center gap-3">
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
            Regla activa
          </label>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <ConditionBuilder conditions={conditions} onChange={setConditions} />
        </div>

        {/* Hierarchy level selector */}
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Niveles de autorización jerárquica
            </label>
            <p className="text-xs text-gray-500">
              Cuando las condiciones se cumplan, la solicitud requerirá la
              aprobación de los N niveles superiores dentro de la cadena de
              mando del solicitante.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700">
            <p>
              El sistema resolverá automáticamente quién es el aprobador
              correspondiente en cada nivel según la jerarquía configurada en el
              perfil del empleado.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setRequiredLevels((prev) => Math.max(1, prev - 1))
                }
                disabled={requiredLevels <= 1}
                className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 text-lg font-medium flex items-center justify-center"
              >
                −
              </button>
              <span className="w-8 text-center text-2xl font-bold text-blue-700">
                {requiredLevels}
              </span>
              <button
                type="button"
                onClick={() =>
                  setRequiredLevels((prev) =>
                    Math.min(MAX_HIERARCHY_LEVELS, prev + 1),
                  )
                }
                disabled={requiredLevels >= MAX_HIERARCHY_LEVELS}
                className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 text-lg font-medium flex items-center justify-center"
              >
                +
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {LEVEL_LABELS[requiredLevels] ??
                  `${requiredLevels} niveles arriba`}
              </p>
              <p className="text-xs text-gray-500">
                {requiredLevels === 1
                  ? "Solo el jefe directo del solicitante debe aprobar."
                  : `Los ${requiredLevels} managers superiores del solicitante deben aprobar.`}
              </p>
            </div>
          </div>

          {/* Visual level scale */}
          <div className="flex gap-1 mt-1">
            {Array.from({ length: MAX_HIERARCHY_LEVELS }, (_, i) => i + 1).map(
              (lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setRequiredLevels(lvl)}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    lvl <= requiredLevels ? "bg-blue-500" : "bg-gray-200"
                  }`}
                  title={LEVEL_LABELS[lvl] ?? `${lvl} niveles arriba`}
                />
              ),
            )}
          </div>
          <p className="text-xs text-gray-400 text-right">
            {requiredLevels} de {MAX_HIERARCHY_LEVELS} niveles
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
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
                : "Crear Regla"}
          </Button>
        </div>
      </form>
    </div>
  );
};

/*
 * Modification History:
 * - 2026-04-08 | Juan de Dios Gastélum Flores | Initial file creation.
 * - 2026-05-12 | Juan de Dios Gastélum | Replaced ApprovalChainBuilder with a hierarchy
 *   level selector; payload now always sends a single hierarchy step to the backend.
 */
