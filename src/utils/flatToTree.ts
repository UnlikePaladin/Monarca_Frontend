/**
 * File: flatToTree.ts
 * Description: Converts the flat list of preview employees returned by the backend into
 *              a hierarchical tree using employeeNumber as the node id and
 *              bossEmployeeNumber as the parent id. Runs in O(n) time and space,
 *              handles missing bosses and detects cycles.
 */

import { PreviewEmployee } from '../types/importEmployees';

export type OrphanReason = 'bossNotInFile' | 'cycleBroken';

export type TreeNode = {
  employeeNumber: string;
  data: PreviewEmployee;
  children: TreeNode[];
  orphanReason?: OrphanReason;
};

export type OrgTree = {
  roots: TreeNode[];
  unidentified: PreviewEmployee[];
  nodesByEmpNo: Map<string, TreeNode>;
};

/**
 * Walks up from the given start node following bossEmployeeNumber pointers looking
 * for selfEmpNo. Uses a memoized safe-seen set for early exit (amortized O(n) total).
 * @returns true if a cycle back to selfEmpNo exists, false otherwise.
 */
const detectsCycle = (
  selfEmpNo: string,
  startEmpNo: string,
  bossByEmpNo: Map<string, string | null>,
  safeSeen: Set<string>,
): boolean => {
  let cursor: string | null = startEmpNo;
  const localSeen = new Set<string>();

  while (cursor) {
    if (cursor === selfEmpNo) return true;
    if (safeSeen.has(cursor)) return false;
    if (localSeen.has(cursor)) return false;

    localSeen.add(cursor);
    cursor = bossByEmpNo.get(cursor) ?? null;
  }

  for (const empNo of localSeen) {
    safeSeen.add(empNo);
  }
  return false;
};

/**
 * Builds the org tree from a flat employee list.
 * @param employees Flat list returned by /users/import/preview.
 * @returns An OrgTree with roots, nodes map and unidentified rows.
 */
export const buildOrgTree = (employees: PreviewEmployee[]): OrgTree => {
  const nodesByEmpNo = new Map<string, TreeNode>();
  const unidentified: PreviewEmployee[] = [];
  const bossByEmpNo = new Map<string, string | null>();

  for (const employee of employees) {
    const empNo = employee.employeeNumber?.trim();
    if (!empNo) {
      unidentified.push(employee);
      continue;
    }

    nodesByEmpNo.set(empNo, {
      employeeNumber: empNo,
      data: employee,
      children: [],
    });
    bossByEmpNo.set(empNo, employee.bossEmployeeNumber?.trim() || null);
  }

  const roots: TreeNode[] = [];
  const safeSeen = new Set<string>();

  for (const node of nodesByEmpNo.values()) {
    const bossEmpNo = bossByEmpNo.get(node.employeeNumber) ?? null;

    if (!bossEmpNo) {
      roots.push(node);
      continue;
    }

    const parent = nodesByEmpNo.get(bossEmpNo);
    if (!parent) {
      node.orphanReason = 'bossNotInFile';
      roots.push(node);
      continue;
    }

    if (detectsCycle(node.employeeNumber, bossEmpNo, bossByEmpNo, safeSeen)) {
      node.orphanReason = 'cycleBroken';
      roots.push(node);
      continue;
    }

    parent.children.push(node);
  }

  return { roots, unidentified, nodesByEmpNo };
};
