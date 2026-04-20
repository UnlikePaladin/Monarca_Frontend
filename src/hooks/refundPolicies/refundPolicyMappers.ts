import {
  RefundPoliciesByCompany,
  RefundPolicy,
  RefundPolicyRule,
} from "../../types/refundPolicies";

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const pickString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
};

const toBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
};

const toNullableNumber = (value: unknown): number | null | undefined => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const pickFirstArray = (record: Record<string, unknown>, keys: string[]): unknown[] => {
  for (const key of keys) {
    const candidate = record[key];
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

export const normalizeRefundPolicyRule = (value: unknown): RefundPolicyRule | null => {
  const raw = toRecord(value);

  const expenseClass = pickString(raw.expense_class, raw.expenseClass);
  const operator = pickString(raw.operator);

  if (!expenseClass || !operator) return null;

  const thresholdValue = toNullableNumber(raw.threshold_value ?? raw.thresholdValue);

  return {
    id: pickString(raw.id),
    id_policy: pickString(raw.id_policy, raw.idPolicy),
    expense_class: expenseClass,
    operator,
    threshold_value: thresholdValue,
    threshold_unit:
      raw.threshold_unit === null || raw.thresholdUnit === null
        ? null
        : pickString(raw.threshold_unit, raw.thresholdUnit) || null,
    consequence: pickString(raw.consequence) || "POLICY_VIOLATION",
    is_active: toBoolean(raw.is_active ?? raw.isActive, true),
  };
};

export const normalizeRefundPolicy = (value: unknown): RefundPolicy | null => {
  const raw = toRecord(value);

  const id = pickString(raw.id);
  const idCompany = pickString(raw.id_company, raw.idCompany, raw.company_id);
  const name = pickString(raw.name);

  if (!id || !idCompany || !name) return null;

  const companyRaw = toRecord(raw.company);
  const rulesRaw = pickFirstArray(raw, ["rules"]);

  return {
    id,
    id_company: idCompany,
    name,
    description: pickString(raw.description),
    is_active: toBoolean(raw.is_active ?? raw.isActive, true),
    created_at: pickString(raw.created_at, raw.createdAt),
    company:
      Object.keys(companyRaw).length > 0
        ? {
            id: pickString(companyRaw.id),
            key: pickString(companyRaw.key),
            name: pickString(companyRaw.name),
          }
        : undefined,
    rules: rulesRaw
      .map((rule) => normalizeRefundPolicyRule(rule))
      .filter((rule): rule is RefundPolicyRule => rule !== null),
  };
};

export const normalizeRefundPoliciesByCompany = (
  response: unknown
): RefundPoliciesByCompany[] => {
  const payload = toRecord(response);
  const groupsRaw = Array.isArray(response)
    ? response
    : pickFirstArray(payload, ["data", "companies", "items"]);

  return groupsRaw
    .map((group) => {
      const groupRecord = toRecord(group);
      const companyRaw = toRecord(groupRecord.company);
      const companyId = pickString(companyRaw.id, groupRecord.id_company, groupRecord.idCompany);

      if (!companyId) return null;

      const policiesRaw = Array.isArray(groupRecord.policies) ? groupRecord.policies : [];

      return {
        company: {
          id: companyId,
          key: pickString(companyRaw.key),
          name: pickString(companyRaw.name) || "Empresa sin nombre",
        },
        policies: policiesRaw
          .map((policy) => normalizeRefundPolicy(policy))
          .filter((policy): policy is RefundPolicy => policy !== null),
      };
    })
    .filter((group): group is RefundPoliciesByCompany => group !== null);
};

export const normalizeRefundPolicyResponse = (response: unknown): RefundPolicy | null => {
  const payload = toRecord(response);
  const raw = payload.policy ?? payload.data ?? response;
  return normalizeRefundPolicy(raw);
};
