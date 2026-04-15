/**
 * Description: Hook to fetch the catalog of available modules and their possible actions.
 *              Used to dynamically build the permission matrix instead of hardcoding modules.
 */

import { useQuery } from '@tanstack/react-query';
import { ActionType } from '../../types/auth';
import { getRequest } from '../../utils/apiService';
import { normalizeAction, pickFirstArray } from './roleMappers';

export interface AvailableModule {
  moduleId: string;
  moduleName: string;
  availableActions: ActionType[];
}

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const toString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const normalizeAvailableModule = (value: unknown): AvailableModule | null => {
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

  const actionsRaw = Array.isArray(raw.availableActions)
    ? raw.availableActions
    : Array.isArray(raw.actions)
    ? raw.actions
    : Array.isArray(raw.allowedActions)
    ? raw.allowedActions
    : [];

  const availableActions = Array.from(
    new Set(
      actionsRaw
        .map((item) => normalizeAction(item))
        .filter((item): item is ActionType => item !== null)
    )
  );

  return {
    moduleId,
    moduleName,
    availableActions,
  };
};

/**
 * Fetches the catalog of available modules and their supported actions.
 * @returns Promise resolving to an array of AvailableModule objects.
 */
const fetchPermissions = async (): Promise<AvailableModule[]> => {
  const response = await getRequest('/permissions');
  const payload = toRecord(response);

  const candidates = Array.isArray(response)
    ? response
    : pickFirstArray(payload, ['modules', 'permissions', 'data']);

  const byModule = new Map<string, AvailableModule>();

  for (const candidate of candidates) {
    const normalized = normalizeAvailableModule(candidate);
    if (!normalized) continue;

    const existing = byModule.get(normalized.moduleId);
    if (!existing) {
      byModule.set(normalized.moduleId, normalized);
      continue;
    }

    byModule.set(normalized.moduleId, {
      ...existing,
      moduleName: existing.moduleName || normalized.moduleName,
      availableActions: Array.from(
        new Set([...existing.availableActions, ...normalized.availableActions])
      ),
    });
  }

  return Array.from(byModule.values());
};

/**
 * Hook to retrieve all available modules and actions for building the permission matrix.
 * @returns Query result containing the permissions catalog, loading state, and error.
 */
export const useGetPermissions = () => {
  return useQuery<AvailableModule[]>({
    queryKey: ['permissions'],
    queryFn: fetchPermissions,
  });
};

/*
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 */
