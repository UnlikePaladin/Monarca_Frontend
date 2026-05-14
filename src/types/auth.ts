/**
 * Description: Type definitions for authorization, roles, and substitute delegations.
 */

export type ActionType = "create" | "read" | "update" | "delete" | "approve";

export interface ModulePermission {
  moduleId: string;
  moduleName: string;
  allowedActions: ActionType[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  permissions: ModulePermission[];
}

export interface SubstituteDelegation {
  id: string;
  originalUserId: string;
  roleId: string | null;
  targetUserId: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

/**
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 * - 2026-05-13 | Juan de Dios Gastélum | Added originalUserId, made roleId nullable to match backend schema.
 */
