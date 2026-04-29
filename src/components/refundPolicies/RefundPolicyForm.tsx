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

const EXPENSE_CLASS_OPTIONS = [
  { id: "ALIF", name: "ALIF - Alimentación" },
  { id: "CAPA", name: "CAPA - Capacitación" },
  { id: "CPF", name: "CPF - Caseta (peaje)" },
  { id: "FIDP", name: "FIDP - Ficha de depósito" },
  { id: "GAS", name: "GAS - Gasolina" },
  { id: "HTLP", name: "HTLP - Hotel pagado" },
  { id: "LAUN", name: "LAUN - Lavandería" },
  { id: "NDPR", name: "NDPR - No deducible" },
  { id: "NDVA", name: "NDVA - No deducible vale azul" },
  { id: "REAU", name: "REAU - Renta de automóvil" },
  { id: "TCCF", name: "TCCF - Taxi con comprobante fiscal" },
  { id: "TSCF", name: "TSCF - Taxi sin comprobante fiscal" },
  { id: "TRAA", name: "TRAA - Transporte automóvil y/o autobús" },
  { id: "AIRP", name: "AIRP - Vuelo pagado" },
  { id: "TODAS", name: "TODAS - Regla de nivel solicitud" },
];

const OPERATOR_OPTIONS = [
  { id: "MISSING_XML", name: "MISSING_XML - Falta XML" },
  { id: "MISSING_PDF", name: "MISSING_PDF - Falta PDF" },
  { id: "MISSING_FILE", name: "MISSING_FILE - Faltan XML y PDF" },
  { id: "LT", name: "LT - Menor que" },
  { id: "LTE", name: "LTE - Menor o igual que" },
  { id: "GT", name: "GT - Mayor que" },
  { id: "GTE", name: "GTE - Mayor o igual que" },
  { id: "TOTAL_LTE_ADVANCE", name: "TOTAL_LTE_ADVANCE - Total vs anticipo" },
  { id: "TOTAL_VOUCHERS_LIMIT", name: "TOTAL_VOUCHERS_LIMIT - Límite total vouchers" },
  { id: "TOTAL_VOUCHERS_LTE_ADVANCE", name: "TOTAL_VOUCHERS_LTE_ADVANCE - Vouchers <= anticipo" },
  { id: "DAYS_EXCEEDED", name: "DAYS_EXCEEDED - Días excedidos" },
  { id: "TIME_LIMIT", name: "TIME_LIMIT - Límite de tiempo" },
  {
    id: "VOUCHER_DATE_WITHIN_TRIP_WINDOW",
    name: "VOUCHER_DATE_WITHIN_TRIP_WINDOW - Fecha dentro del viaje",
  },
];

const CONSEQUENCE_OPTIONS = ["WARNING", "POLICY_VIOLATION"];
const UNIT_OPTIONS = ["MXN", "DAYS", "USD"];

const REQUEST_LEVEL_OPERATORS = new Set([
  "TOTAL_LTE_ADVANCE",
  "TOTAL_VOUCHERS_LIMIT",
  "TOTAL_VOUCHERS_LTE_ADVANCE",
  "DAYS_EXCEEDED",
  "TIME_LIMIT",
  "VOUCHER_DATE_WITHIN_TRIP_WINDOW",
]);
const TIME_OPERATORS = new Set(["DAYS_EXCEEDED", "TIME_LIMIT"]);
const THRESHOLD_REQUIRED_OPERATORS = new Set([
  "LT",
  "LTE",
  "GT",
  "GTE",
  "DAYS_EXCEEDED",
  "TIME_LIMIT",
  "TOTAL_VOUCHERS_LIMIT",
]);
const NO_THRESHOLD_OPERATORS = new Set([
  "MISSING_XML",
  "MISSING_PDF",
  "MISSING_FILE",
  "TOTAL_LTE_ADVANCE",
  "TOTAL_VOUCHERS_LTE_ADVANCE",
  "VOUCHER_DATE_WITHIN_TRIP_WINDOW",
]);

const toOptions = (items: string[]) =>
  items.map((item) => ({ id: item, name: item }));

const expenseClassOptions = EXPENSE_CLASS_OPTIONS;
const operatorOptions = OPERATOR_OPTIONS;
const consequenceOptions = toOptions(CONSEQUENCE_OPTIONS);
const unitOptions = toOptions(UNIT_OPTIONS);

const operatorHelpMap: Record<
  string,
  {
    scope: "Comprobante" | "Solicitud";
    description: string;
    thresholdHint: string;
  }
> = {
  MISSING_XML: {
    scope: "Comprobante",
    description: "Falla si falta el archivo XML del comprobante.",
    thresholdHint: "No usa valor umbral.",
  },
  MISSING_PDF: {
    scope: "Comprobante",
    description: "Falla si falta el archivo PDF del comprobante.",
    thresholdHint: "No usa valor umbral.",
  },
  MISSING_FILE: {
    scope: "Comprobante",
    description: "Falla cuando no existen XML y PDF.",
    thresholdHint: "No usa valor umbral.",
  },
  LT: {
    scope: "Comprobante",
    description: "Evalúa monto menor que el umbral configurado.",
    thresholdHint: "Requiere valor umbral.",
  },
  LTE: {
    scope: "Comprobante",
    description: "Evalúa monto menor o igual que el umbral.",
    thresholdHint: "Requiere valor umbral.",
  },
  GT: {
    scope: "Comprobante",
    description: "Evalúa monto mayor que el umbral configurado.",
    thresholdHint: "Requiere valor umbral.",
  },
  GTE: {
    scope: "Comprobante",
    description: "Evalúa monto mayor o igual que el umbral.",
    thresholdHint: "Requiere valor umbral.",
  },
  TOTAL_LTE_ADVANCE: {
    scope: "Solicitud",
    description: "Compara total de comprobantes contra el anticipo de la solicitud.",
    thresholdHint: "No usa valor umbral.",
  },
  TOTAL_VOUCHERS_LIMIT: {
    scope: "Solicitud",
    description: "Limita el total acumulado de comprobantes.",
    thresholdHint: "Requiere valor umbral.",
  },
  TOTAL_VOUCHERS_LTE_ADVANCE: {
    scope: "Solicitud",
    description: "Valida que el total de comprobantes no supere el anticipo.",
    thresholdHint: "No usa valor umbral.",
  },
  DAYS_EXCEEDED: {
    scope: "Solicitud",
    description: "Controla días máximos permitidos para comprobación.",
    thresholdHint: "Requiere umbral en DAYS.",
  },
  TIME_LIMIT: {
    scope: "Solicitud",
    description: "Evalúa si se excede el tiempo límite configurado.",
    thresholdHint: "Requiere umbral en DAYS.",
  },
  VOUCHER_DATE_WITHIN_TRIP_WINDOW: {
    scope: "Solicitud",
    description: "Valida que la fecha del comprobante esté dentro de la ventana del viaje.",
    thresholdHint: "No usa valor umbral.",
  },
};

const isRequestLevelOperator = (operator?: string) =>
  Boolean(operator && REQUEST_LEVEL_OPERATORS.has(operator));

const requiresThreshold = (operator?: string) =>
  Boolean(operator && THRESHOLD_REQUIRED_OPERATORS.has(operator));

const shouldBlockThreshold = (operator?: string) =>
  Boolean(operator && NO_THRESHOLD_OPERATORS.has(operator));

const recommendedUnitForOperator = (operator?: string): string => {
  if (!operator) return "";
  if (TIME_OPERATORS.has(operator)) return "DAYS";
  if (THRESHOLD_REQUIRED_OPERATORS.has(operator)) return "MXN";
  return "";
};

const ruleSchema = z.object({
  expense_class: z.string().min(1, "La clase de gasto es requerida"),
  operator: z.string().min(1, "El operador es requerido"),
  threshold_value: z.union([z.number(), z.null()]).optional(),
  threshold_unit: z.string().optional(),
  consequence: z.string().optional(),
  is_active: z.boolean(),
}).superRefine((rule, ctx) => {
  const operator = rule.operator;

  if (isRequestLevelOperator(operator) && rule.expense_class !== "TODAS") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expense_class"],
      message: "Para operadores de nivel solicitud, la clase de gasto debe ser TODAS.",
    });
  }

  if (requiresThreshold(operator)) {
    if (rule.threshold_value === null || rule.threshold_value === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["threshold_value"],
        message: "Este operador requiere valor umbral numérico.",
      });
    }
  }
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
  fallbackCompany?: {
    id: string;
    key?: string;
    name: string;
  };
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
    expense_class: isRequestLevelOperator(rule.operator)
      ? "TODAS"
      : rule.expense_class.trim(),
    operator: rule.operator.trim(),
    threshold_value:
      shouldBlockThreshold(rule.operator)
        ? null
        : typeof rule.threshold_value === "number" && Number.isFinite(rule.threshold_value)
        ? rule.threshold_value
        : null,
    threshold_unit: shouldBlockThreshold(rule.operator)
      ? null
      : rule.threshold_unit?.trim()
      ? rule.threshold_unit.trim()
      : null,
    consequence: rule.consequence?.trim() || "POLICY_VIOLATION",
    is_active: rule.is_active,
  }));
};

const mapPolicyRulesToFormRules = (policy?: RefundPolicy): PolicyFormData["rules"] => {
  if (!policy) return [defaultRule];

  return policy.rules.map((rule) => ({
    expense_class: rule.expense_class,
    operator: rule.operator,
    threshold_value: rule.threshold_value ?? null,
    threshold_unit: rule.threshold_unit ?? "",
    consequence: rule.consequence ?? "POLICY_VIOLATION",
    is_active: rule.is_active !== false,
  }));
};

export const RefundPolicyForm = ({
  policy,
  groups,
  fallbackCompany,
  onClose,
}: RefundPolicyFormProps) => {
  const isEditMode = Boolean(policy);

  const groupsOptions: Option[] = groups.map((group) => ({
    id: group.company.id,
    name: `${group.company.name}${group.company.key ? ` (${group.company.key})` : ""}`,
  }));

  const fallbackOption = fallbackCompany
    ? {
        id: fallbackCompany.id,
        name: `${fallbackCompany.name}${fallbackCompany.key ? ` (${fallbackCompany.key})` : ""}`,
      }
    : undefined;

  const companyOptions: Option[] = (() => {
    if (!fallbackOption) return groupsOptions;
    if (groupsOptions.some((option) => option.id === fallbackOption.id)) return groupsOptions;
    return [fallbackOption, ...groupsOptions];
  })();

  const shouldShowCompanySelector = companyOptions.length > 1;

  const initialCompanyId =
    policy?.id_company || fallbackOption?.id || companyOptions[0]?.id || "";

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
      rules: mapPolicyRulesToFormRules(policy),
      replaceRules: !isEditMode,
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "rules",
  });

  const selectedCompanyId = watch("id_company");
  const selectedCompany = companyOptions.find((option) => option.id === selectedCompanyId) ?? null;
  const initialRulesPayload = normalizeRulesForPayload(mapPolicyRulesToFormRules(policy)).filter(
    (rule) => rule.expense_class && rule.operator
  );

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
        const shouldSendRulesInUpdate =
          formData.replaceRules ||
          JSON.stringify(rulesPayload) !== JSON.stringify(initialRulesPayload);

        if (formData.replaceRules) {
          const confirmed = confirm(
            "Estas por reemplazar todas las reglas actuales de la política. ¿Deseas continuar?"
          );

          if (!confirmed) return;
        }

        const payload: UpdateRefundPolicyPayload = {
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          is_active: formData.is_active,
          id_company: formData.id_company,
        };

        if (shouldSendRulesInUpdate) {
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
    <div id="refund_policy_form" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-6">
        {isEditMode ? "Editar política de reembolso" : "Nueva política de reembolso"}
      </h3>

      <details className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">
          Guía rápida de terminología
        </summary>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
          <p><strong>Clase de gasto:</strong> categoría de comprobante a la que aplica la regla.</p>
          <p><strong>Operador:</strong> condición que se evaluará.</p>
          <p><strong>Valor umbral:</strong> número límite cuando el operador lo requiere.</p>
          <p><strong>Unidad umbral:</strong> unidad del umbral, por ejemplo MXN o DAYS.</p>
          <p><strong>Consecuencia:</strong> WARNING avisa; POLICY_VIOLATION bloquea el flujo.</p>
          <p><strong>Regla activa:</strong> define si la regla participa en evaluación.</p>
        </div>
        <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold text-slate-800">
            Clase de gasto (código canónico y significado)
          </p>
          <p className="text-[11px] text-slate-600 mt-1">
            Se muestra una descripción amigable, pero siempre se envía el código corto al backend.
          </p>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-slate-700">
            {expenseClassOptions.map((item) => (
              <p key={item.id}>{item.name}</p>
            ))}
          </div>
        </div>
      </details>

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

        <div id="refund_policy_rules" className="border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Reglas</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isEditMode
                  ? "Si editas reglas y guardas, se enviará la lista completa actual."
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
              fields.map((field, index) => {
                const selectedOperator = watch(`rules.${index}.operator`);
                const lockExpenseClass = isRequestLevelOperator(selectedOperator);
                const operatorRequiresThreshold = requiresThreshold(selectedOperator);
                const operatorBlocksThreshold = shouldBlockThreshold(selectedOperator);
                const selectedThresholdUnit = watch(`rules.${index}.threshold_unit`);
                const operatorHelp = selectedOperator ? operatorHelpMap[selectedOperator] : undefined;

                return (
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
                      <Controller
                        control={control}
                        name={`rules.${index}.expense_class`}
                        render={({ field: classField }) => (
                          <Select
                            options={expenseClassOptions}
                            value={
                              expenseClassOptions.find(
                                (option) => option.id === classField.value
                              ) ?? null
                            }
                            onChange={(option) => classField.onChange(String(option.id))}
                            isDisabled={lockExpenseClass}
                            placeholder="Selecciona clase de gasto"
                          />
                        )}
                      />
                      {lockExpenseClass && (
                        <p className="mt-1 text-xs text-gray-500">
                          Para este operador se fuerza automáticamente la clase TODAS.
                        </p>
                      )}
                      {!lockExpenseClass && (
                        <p className="mt-1 text-xs text-gray-500">
                          Se muestra nombre amigable, pero se enviará el código (ej. HTLP) al backend.
                        </p>
                      )}
                      <FieldError msg={errors.rules?.[index]?.expense_class?.message} />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Operador</label>
                      <Controller
                        control={control}
                        name={`rules.${index}.operator`}
                        render={({ field: operatorField }) => (
                          <Select
                            options={operatorOptions}
                            value={
                              operatorOptions.find(
                                (option) => option.id === operatorField.value
                              ) ?? null
                            }
                            onChange={(option) => {
                              const nextOperator = String(option.id);
                              operatorField.onChange(nextOperator);

                              if (isRequestLevelOperator(nextOperator)) {
                                setValue(`rules.${index}.expense_class`, "TODAS", {
                                  shouldValidate: true,
                                });
                              }

                              if (shouldBlockThreshold(nextOperator)) {
                                setValue(`rules.${index}.threshold_value`, null, {
                                  shouldValidate: true,
                                });
                                setValue(`rules.${index}.threshold_unit`, "", {
                                  shouldValidate: true,
                                });
                                toast.info(
                                  "Este operador no usa valor umbral. Se limpiaron esos campos.",
                                  { position: "top-right", autoClose: 3000 }
                                );
                              }

                              if (requiresThreshold(nextOperator) && !selectedThresholdUnit) {
                                setValue(
                                  `rules.${index}.threshold_unit`,
                                  recommendedUnitForOperator(nextOperator),
                                  { shouldValidate: true }
                                );
                              }
                            }}
                            placeholder="Selecciona operador"
                          />
                        )}
                      />
                      <FieldError msg={errors.rules?.[index]?.operator?.message} />
                      {operatorHelp && (
                        <div className="mt-2 rounded-md border border-blue-100 bg-blue-50 px-2 py-2 text-xs text-blue-900">
                          <p className="font-semibold">{operatorHelp.scope}</p>
                          <p>{operatorHelp.description}</p>
                          <p className="mt-1">{operatorHelp.thresholdHint}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Valor umbral</label>
                      <Input
                        type="number"
                        step="any"
                        disabled={operatorBlocksThreshold}
                        placeholder={
                          operatorRequiresThreshold
                            ? "Captura un valor numérico"
                            : "No aplica para este operador"
                        }
                        {...register(`rules.${index}.threshold_value`, {
                          setValueAs: (value) => {
                            if (value === "" || value === null || value === undefined) return null;
                            const parsed = Number(value);
                            return Number.isFinite(parsed) ? parsed : null;
                          },
                        })}
                      />
                      {operatorRequiresThreshold && (
                        <p className="mt-1 text-xs text-gray-500">
                          Este operador requiere valor umbral numérico.
                        </p>
                      )}
                      <FieldError msg={errors.rules?.[index]?.threshold_value?.message} />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Unidad umbral</label>
                      <Controller
                        control={control}
                        name={`rules.${index}.threshold_unit`}
                        render={({ field: unitField }) => (
                          <Select
                            options={unitOptions}
                            value={
                              unitOptions.find((option) => option.id === unitField.value) ?? null
                            }
                            onChange={(option) => unitField.onChange(String(option.id))}
                            isDisabled={operatorBlocksThreshold}
                            placeholder="Selecciona unidad"
                          />
                        )}
                      />
                    </div>

                    <div id={index === 0 ? "refund_policy_consequence" : undefined}>
                      <label className="block text-xs text-gray-600 mb-1">Consecuencia</label>
                      <Controller
                        control={control}
                        name={`rules.${index}.consequence`}
                        render={({ field: consequenceField }) => (
                          <Select
                            options={consequenceOptions}
                            value={
                              consequenceOptions.find(
                                (option) => option.id === consequenceField.value
                              ) ?? null
                            }
                            onChange={(option) => consequenceField.onChange(String(option.id))}
                            placeholder="Selecciona consecuencia"
                          />
                        )}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        WARNING no bloquea. POLICY_VIOLATION bloquea el flujo.
                      </p>
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
              )})
            )}
          </div>
        </div>

        <div id="refund_policy_replace_warning" className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
          Al editar reglas, el backend recibe el conjunto completo actual de reglas.
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
