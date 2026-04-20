import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { AxiosError } from "axios";
import { z } from "zod";
import Select from "../ui/Select";
import FieldError from "../ui/FieldError";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import {
  CreateRefundPolicyPayload,
  RefundPoliciesByCompany,
  RefundPolicy,
  RefundPolicyRuleInput,
  UpdateRefundPolicyPayload,
} from "../../types/refundPolicies";
import { useCreateRefundPolicy } from "../../hooks/refundPolicies/useCreateRefundPolicy";
import { useUpdateRefundPolicy } from "../../hooks/refundPolicies/useUpdateRefundPolicy";
import { toast } from "react-toastify";

const ruleSchema = z.object({
  expense_class: z.string().min(1, "La clase de gasto es requerida"),
  operator: z.string().min(1, "El operador es requerido"),
  threshold_value: z
    .union([z.number(), z.null()])
    .optional(),
  threshold_unit: z.string().optional(),
  consequence: z.string().optional(),
  is_active: z.boolean(),
});

const policyFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(120, "Máximo 120 caracteres"),
  description: z.string().max(400, "Máximo 400 caracteres").optional(),
  is_active: z.boolean(),
  id_company: z.string().optional(),
  rules: z.array(ruleSchema),
  replaceRules: z.boolean(),
});

type PolicyFormData = z.infer<typeof policyFormSchema>;

type Option = {
  id: string;
  name: string;
};

interface RefundPolicyFormProps {
  policy?: RefundPolicy;
  groups: RefundPoliciesByCompany[];
  onClose: () => void;
}

const defaultRule = {
  expense_class: "",
  operator: "",
  threshold_value: null,
  threshold_unit: "",
  consequence: "POLICY_VIOLATION",
  is_active: true,
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    if (error.response?.status === 403) {
      return "No tienes permisos para administrar políticas de otra compañía.";
    }

    if (error.response?.status === 401) {
      return "Tu sesión expiró. Inicia sesión de nuevo.";
    }

    if (error.response?.status === 404) {
      return "No se encontró la política o la compañía solicitada.";
    }

    if (error.response?.data) {
      const responseData = error.response.data as { message?: unknown };
      if (typeof responseData.message === "string" && responseData.message) {
        return responseData.message;
      }
    }
  }

  return fallback;
};

const normalizeRulesForPayload = (
  rules: PolicyFormData["rules"]
): RefundPolicyRuleInput[] => {
  return rules.map((rule) => ({
    expense_class: rule.expense_class.trim(),
    operator: rule.operator.trim(),
    threshold_value:
      typeof rule.threshold_value === "number" && Number.isFinite(rule.threshold_value)
        ? rule.threshold_value
        : null,
    threshold_unit: rule.threshold_unit?.trim() ? rule.threshold_unit.trim() : null,
    consequence: rule.consequence?.trim() || "POLICY_VIOLATION",
    is_active: rule.is_active,
  }));
};

export const RefundPolicyForm = ({ policy, groups, onClose }: RefundPolicyFormProps) => {
  const isEditMode = Boolean(policy);

  const companyOptions: Option[] = groups.map((group) => ({
    id: group.company.id,
    name: `${group.company.name}${group.company.key ? ` (${group.company.key})` : ""}`,
  }));

  const shouldShowCompanySelector = companyOptions.length > 1;

  const initialCompanyId =
    policy?.id_company || companyOptions[0]?.id || "";

  const { mutateAsync: createPolicy, isPending: isCreating } = useCreateRefundPolicy();
  const { mutateAsync: updatePolicy, isPending: isUpdating } = useUpdateRefundPolicy();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PolicyFormData>({
    resolver: zodResolver(policyFormSchema),
    defaultValues: {
      name: policy?.name ?? "",
      description: policy?.description ?? "",
      is_active: policy?.is_active ?? true,
      id_company: initialCompanyId,
      rules:
        policy?.rules.map((rule) => ({
          expense_class: rule.expense_class,
          operator: rule.operator,
          threshold_value: rule.threshold_value ?? null,
          threshold_unit: rule.threshold_unit ?? "",
          consequence: rule.consequence ?? "POLICY_VIOLATION",
          is_active: rule.is_active !== false,
        })) ?? [defaultRule],
      replaceRules: !isEditMode,
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "rules",
  });

  const selectedCompanyId = watch("id_company");
  const selectedCompany = companyOptions.find((option) => option.id === selectedCompanyId) ?? null;

  const onSubmit = async (formData: PolicyFormData) => {
    if (!formData.id_company) {
      toast.error("Selecciona una compañía para continuar.", {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    const rulesPayload = normalizeRulesForPayload(formData.rules).filter(
      (rule) => rule.expense_class && rule.operator
    );

    try {
      if (isEditMode && policy) {
        const payload: UpdateRefundPolicyPayload = {
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          is_active: formData.is_active,
          id_company: formData.id_company,
        };

        if (formData.replaceRules) {
          payload.rules = rulesPayload;
        }

        await updatePolicy({
          policyId: policy.id,
          data: payload,
        });

        toast.success("Política actualizada correctamente", {
          position: "top-right",
          autoClose: 3000,
        });
        onClose();
        return;
      }

      const payload: CreateRefundPolicyPayload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        is_active: formData.is_active,
        id_company: formData.id_company,
        rules: rulesPayload,
      };

      await createPolicy(payload);

      toast.success("Política creada correctamente", {
        position: "top-right",
        autoClose: 3000,
      });
      onClose();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          isEditMode ? "Error al actualizar la política" : "Error al crear la política"
        ),
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
    }
  };

  const isPending = isSubmitting || isCreating || isUpdating;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-6">
        {isEditMode ? "Editar política de reembolso" : "Nueva política de reembolso"}
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="policy-name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <Input id="policy-name" {...register("name")} />
          <FieldError msg={errors.name?.message} />
        </div>

        <div>
          <label htmlFor="policy-description" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            id="policy-description"
            rows={3}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
            {...register("description")}
          />
          <FieldError msg={errors.description?.message} />
        </div>

        {shouldShowCompanySelector ? (
          <div>
            <label htmlFor="policy-company" className="block text-sm font-medium text-gray-700 mb-1">
              Compañía
            </label>
            <Controller
              control={control}
              name="id_company"
              render={({ field }) => (
                <Select
                  id="policy-company"
                  options={companyOptions}
                  value={selectedCompany}
                  onChange={(option) => field.onChange(String(option.id))}
                  placeholder="Selecciona una compañía"
                />
              )}
            />
            <FieldError msg={errors.id_company?.message} />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Compañía</label>
            <div className="rounded-md bg-gray-50 px-3 py-2.5 text-sm text-gray-900 border border-gray-200">
              {companyOptions[0]?.name || "Sin compañía"}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <input
              id="is_active"
              type="checkbox"
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
              {...register("is_active")}
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
              Política activa
            </label>
          </div>

          {isEditMode && (
            <div className="flex items-center gap-3">
              <input
                id="replaceRules"
                type="checkbox"
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                {...register("replaceRules")}
              />
              <label htmlFor="replaceRules" className="text-sm font-medium text-gray-700 cursor-pointer">
                Reemplazar reglas actuales
              </label>
            </div>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Reglas</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isEditMode
                  ? "Si activas reemplazo, se enviará la lista completa de reglas." 
                  : "Define las reglas que se crearán junto con la política."}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => append(defaultRule)}
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                + Regla
              </button>
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => {
                    replace([]);
                    setValue("replaceRules", true);
                  }}
                  className="text-xs px-3 py-1.5 border border-red-300 rounded-md text-red-700 hover:bg-red-50"
                >
                  Limpiar reglas
                </button>
              )}
            </div>
          </div>

          <div className="p-4 space-y-4">
            {fields.length === 0 ? (
              <p className="text-sm text-gray-500">No hay reglas en el editor.</p>
            ) : (
              fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">Regla #{index + 1}</p>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Clase de gasto</label>
                      <Input {...register(`rules.${index}.expense_class`)} placeholder="Ej. HTLP" />
                      <FieldError msg={errors.rules?.[index]?.expense_class?.message} />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Operador</label>
                      <Input {...register(`rules.${index}.operator`)} placeholder="Ej. MISSING_XML" />
                      <FieldError msg={errors.rules?.[index]?.operator?.message} />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Valor umbral</label>
                      <Input
                        type="number"
                        step="any"
                        {...register(`rules.${index}.threshold_value`, {
                          setValueAs: (value) => {
                            if (value === "" || value === null || value === undefined) return null;
                            const parsed = Number(value);
                            return Number.isFinite(parsed) ? parsed : null;
                          },
                        })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Unidad umbral</label>
                      <Input {...register(`rules.${index}.threshold_unit`)} placeholder="Ej. MXN" />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Consecuencia</label>
                      <Input
                        {...register(`rules.${index}.consequence`)}
                        placeholder="POLICY_VIOLATION"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        id={`rule-is-active-${index}`}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                        {...register(`rules.${index}.is_active`)}
                      />
                      <label
                        htmlFor={`rule-is-active-${index}`}
                        className="text-xs font-medium text-gray-700 cursor-pointer"
                      >
                        Regla activa
                      </label>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            Cancelar
          </button>
          <Button type="submit" disabled={isPending} className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
            {isPending
              ? "Guardando..."
              : isEditMode
                ? "Guardar cambios"
                : "Crear política"}
          </Button>
        </div>
      </form>
    </div>
  );
};
