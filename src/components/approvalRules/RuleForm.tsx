/**
 * Description: Form component to create or edit an approval rule.
 *              Operates in create mode when no rule prop is provided, and edit mode otherwise.
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApprovalRule, RuleCondition, ApprovalLevel } from '../../types/approvalRules';
import { ConditionBuilder } from './ConditionBuilder';
import { ApprovalChainBuilder } from './ApprovalChainBuilder';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import FieldError from '../ui/FieldError';
import { useCreateApprovalRule } from '../../hooks/approvalRules/useCreateApprovalRule';
import { useUpdateApprovalRule } from '../../hooks/approvalRules/useUpdateApprovalRule';

const ruleFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre no puede superar los 100 caracteres'),
  isActive: z.boolean(),
});

type RuleFormData = z.infer<typeof ruleFormSchema>;

interface RuleFormProps {
  rule?: ApprovalRule;
  onClose: () => void;
}

/**
 * Renders a form to create or edit an approval rule including conditions and approval chain.
 * @param rule Optional existing rule; when provided the form operates in edit mode.
 * @param onClose Callback triggered when the form is cancelled or successfully submitted.
 * @returns React component with the rule form.
 */
export const RuleForm = ({ rule, onClose }: RuleFormProps) => {
  const isEditMode = !!rule;
  const [conditions, setConditions] = useState<RuleCondition[]>(rule?.conditions ?? []);
  const [approvalChain, setApprovalChain] = useState<ApprovalLevel[]>(rule?.approvalChain ?? []);

  const { mutate: createRule, isPending: isCreating } = useCreateApprovalRule();
  const { mutate: updateRule, isPending: isUpdating } = useUpdateApprovalRule();
  const isPending = isCreating || isUpdating;

  const { register, handleSubmit, formState: { errors } } = useForm<RuleFormData>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      name: rule?.name ?? '',
      isActive: rule?.isActive ?? true,
    },
  });

  /**
   * Handles form submission by calling the appropriate mutation based on the current mode.
   * @param formData Validated form data from React Hook Form.
   */
  const onSubmit = (formData: RuleFormData) => {
    const payload = { ...formData, conditions, approvalChain };

    if (isEditMode) {
      updateRule({ ruleId: rule.id, data: payload }, { onSuccess: onClose });
    } else {
      createRule(payload, { onSuccess: onClose });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-6">
        {isEditMode ? 'Editar Regla' : 'Nueva Regla'}
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <Input {...register('name')} placeholder="Ej. Viaje internacional de alto costo" />
          {errors.name && <FieldError msg={errors.name.message} />}
        </div>

        <div className="flex items-center gap-3">
          <input
            id="isActive"
            type="checkbox"
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            {...register('isActive')}
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
            Regla activa
          </label>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <ConditionBuilder conditions={conditions} onChange={setConditions} />
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <ApprovalChainBuilder chain={approvalChain} onChange={setApprovalChain} />
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
            {isPending ? 'Guardando...' : isEditMode ? 'Guardar Cambios' : 'Crear Regla'}
          </Button>
        </div>
      </form>
    </div>
  );
};

/*
 * Modification History:
 * - 2026-04-08 | Juan de Dios Gastélum Flores | Initial file creation.
 */
