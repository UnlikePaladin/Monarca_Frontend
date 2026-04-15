import { ActionType, ModulePermission, Role } from '../../types/auth';

const ACTION_MAP: Record<string, ActionType> = {
  create: 'create',
  read: 'read',
  view: 'read',
  list: 'read',
  update: 'update',
  edit: 'update',
  delete: 'delete',
  remove: 'delete',
  approve: 'approve',
};

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const toString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

export const normalizeAction = (value: unknown): ActionType | null => {
  const raw = toString(value).trim().toLowerCase();
  return raw && ACTION_MAP[raw] ? ACTION_MAP[raw] : null;
};

const normalizeActions = (value: unknown): ActionType[] => {
  if (!Array.isArray(value)) return [];
  const actions = value
    .map((item) => normalizeAction(item))
    .filter((item): item is ActionType => item !== null);
  return Array.from(new Set(actions));
};

export const normalizeModulePermission = (
  value: unknown
): ModulePermission | null => {
  const raw = toRecord(value);
  const module = toRecord(raw.module);

  const moduleId =
    toString(raw.moduleId) ||
    toString(raw.module_id) ||
    toString(raw.id) ||
    toString(module.id);

  if (!moduleId) return null;

  const moduleName =
    toString(raw.moduleName) ||
    toString(raw.module_name) ||
    toString(raw.name) ||
    toString(module.name) ||
    moduleId;

  const allowedActions = normalizeActions(
    raw.allowedActions ?? raw.actions ?? raw.availableActions
  );

  return {
    moduleId,
    moduleName,
    allowedActions,
  };
};

export const normalizeRole = (value: unknown): Role | null => {
  const raw = toRecord(value);

  const id = toString(raw.id) || toString(raw.roleId) || toString(raw.role_id);
  if (!id) return null;

  const permissionsRaw = Array.isArray(raw.permissions)
    ? raw.permissions
    : Array.isArray(raw.modulePermissions)
    ? raw.modulePermissions
    : [];

  return {
    id,
    name: toString(raw.name),
    description: toString(raw.description),
    isActive: Boolean(raw.isActive ?? raw.active ?? true),
    permissions: permissionsRaw
      .map((item) => normalizeModulePermission(item))
      .filter((item): item is ModulePermission => item !== null),
  };
};

export const pickFirstArray = (
  source: Record<string, unknown>,
  keys: string[]
): unknown[] => {
  for (const key of keys) {
    if (Array.isArray(source[key])) {
      return source[key] as unknown[];
    }
  }
  return [];
};
