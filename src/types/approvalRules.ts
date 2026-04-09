/**
 * Description: Type definitions for approval rules, conditions, and approval chains.
 */

export type ConditionField = 'trip_type' | 'cost' | 'priority';
export type ConditionOperator = 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
export type TripType = 'nacional' | 'internacional';
export type Priority = 'alta' | 'media' | 'baja';

export interface RuleCondition {
  field: ConditionField;
  operator?: ConditionOperator;
  value: string | number;
}

export interface ApprovalLevel {
  order: number;
  roleId: string;
  roleName: string;
  requiredApprovals: number;
}

export interface ApprovalRule {
  id: string;
  name: string;
  isActive: boolean;
  conditions: RuleCondition[];
  approvalChain: ApprovalLevel[];
}

/*
 * Modification History:
 * - 2026-04-08 | Juan de Dios Gastélum Flores | Initial file creation.
 */
