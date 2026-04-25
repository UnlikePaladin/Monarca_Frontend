export type RefundPolicyRule = {
  id?: string;
  id_policy?: string;
  expense_class: string;
  operator: string;
  threshold_value?: number | null;
  threshold_unit?: string | null;
  consequence?: string;
  is_active?: boolean;
};

export type RefundPolicy = {
  id: string;
  id_company: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  company?: {
    id: string;
    key: string;
    name: string;
  };
  rules: RefundPolicyRule[];
};

export type RefundPoliciesByCompany = {
  company: {
    id: string;
    key: string;
    name: string;
  };
  policies: RefundPolicy[];
};

export type RefundPolicyRuleInput = {
  expense_class: string;
  operator: string;
  threshold_value?: number | null;
  threshold_unit?: string | null;
  consequence?: string;
  is_active?: boolean;
};

export type CreateRefundPolicyPayload = {
  name: string;
  description?: string;
  is_active?: boolean;
  id_company?: string;
  rules?: RefundPolicyRuleInput[];
};

export type UpdateRefundPolicyPayload = {
  name?: string;
  description?: string;
  is_active?: boolean;
  id_company?: string;
  rules?: RefundPolicyRuleInput[];
};

export type DeleteRefundPolicyResponse = {
  status: boolean;
  message: string;
};
