/**
 * File: importEmployees.ts
 * Description: Frontend mirrors of the backend DTOs used by the employee Excel import flow.
 *              Keep these types aligned with Monarca_Backend/monarca/src/users/dto/import-*.dto.ts.
 */

export type AvailableRole = {
  id: string;
  name: string;
};

export type PreviewEmployee = {
  row: number;
  employeeNumber: string;
  name: string;
  lastName: string;
  username: string | null;
  email: string | null;
  supplierNumber: string | null;
  departmentId: string | null;
  departmentName: string | null;
  bossEmployeeNumber: string | null;
  availabilityStatus: string;
  signupDate: string | null;
  lastchangeDate: string | null;
  isUpdate: boolean;
  validationErrors: string[];
  /** Auto-suggested role UUID from backend: Aprobador if manager in batch, else Solicitante. */
  suggestedRoleId: string | null;
  /** ID of the assigned role (for view-only displays) */
  idRole?: string | null;
  /** Name of the assigned role (for view-only displays) */
  roleName?: string;
};

export type PreviewResponse = {
  employees: PreviewEmployee[];
  availableRoles: AvailableRole[];
  totalRows: number;
  validRows: number;
  errorRows: number;
};

export type ConfirmEmployee = {
  employeeNumber: string;
  name: string;
  lastName: string;
  username: string | null;
  email: string | null;
  supplierNumber: string | null;
  departmentId: string;
  bossEmployeeNumber: string | null;
  availabilityStatus: string;
  signupDate: string | null;
  lastchangeDate: string | null;
  idRole: string;
};

export type ConfirmImportPayload = {
  employees: ConfirmEmployee[];
};

export type ImportError = {
  employeeNumber: string;
  message: string;
};

export type ImportResult = {
  created: number;
  updated: number;
  errors: ImportError[];
};
