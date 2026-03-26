/**
 * Description: Page for managing system roles, permissions, and substitute delegations.
 *              Accessible only to users with the manage_users permission.
 */

import React, { useEffect, useState } from 'react';
import { Role } from '../../types/auth';
import { RoleList } from '../../components/roles/RoleList';
import { RoleForm } from '../../components/roles/RoleForm';
import { SubstitutePanel } from '../../components/SubstitutePanel';
import { ActiveDelegationsList } from '../../components/substitutes/ActiveDelegationsList';
import { useApp } from '../../hooks/app/appContext';

type ActiveTab = 'roles' | 'delegations';
type FormMode = 'create' | 'edit' | null;

const TABS: { key: ActiveTab; label: string }[] = [
  { key: 'roles', label: 'Roles y Permisos' },
  { key: 'delegations', label: 'Delegaciones de Sustitutos' },
];

/**
 * Renders the role and delegation management page with tab-based navigation.
 * @returns React page component for role administration.
 */
const Roles = () => {
  const { setPageTitle } = useApp();
  const [activeTab, setActiveTab] = useState<ActiveTab>('roles');
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);

  useEffect(() => {
    setPageTitle('Administración de Roles');
  }, []);

  /**
   * Opens the role form in create mode and clears any previously selected role.
   */
  const handleCreate = () => {
    setSelectedRole(undefined);
    setFormMode('create');
  };

  /**
   * Opens the role form in edit mode with the selected role data pre-filled.
   * @param role The role to be edited.
   */
  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setFormMode('edit');
  };

  /**
   * Closes the role form and resets mode and selection state.
   */
  const handleCloseForm = () => {
    setSelectedRole(undefined);
    setFormMode(null);
  };

  /**
   * Switches the active tab and closes any open form.
   * @param tab The tab key to navigate to.
   */
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    handleCloseForm();
  };

  return (
    <div className="px-16 pt-32 flex-1 pb-12">
      <div className="max-w-5xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administración de Roles</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configura roles, asigna permisos granulares y gestiona delegaciones temporales.
          </p>
        </div>

        <div className="flex border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'roles' && (
          <div className="space-y-6">
            {formMode !== null ? (
              <RoleForm role={selectedRole} onClose={handleCloseForm} />
            ) : (
              <RoleList onEdit={handleEdit} onCreate={handleCreate} />
            )}
          </div>
        )}

        {activeTab === 'delegations' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <SubstitutePanel />
            <ActiveDelegationsList />
          </div>
        )}

      </div>
    </div>
  );
};

export default Roles;

/*
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 */
