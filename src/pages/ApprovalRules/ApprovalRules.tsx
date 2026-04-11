/**
 * Description: Page for configuring the dynamic approval rule matrix per company.
 *              Accessible only to users with the manage_users permission.
 */

import React, { useEffect, useState } from 'react';
import { ApprovalRule } from '../../types/approvalRules';
import { RuleList } from '../../components/approvalRules/RuleList';
import { RuleForm } from '../../components/approvalRules/RuleForm';
import { useApp } from '../../hooks/app/appContext';

type FormMode = 'create' | 'edit' | null;

/**
 * Renders the approval rule matrix configuration page.
 * @returns React page component for approval rule administration.
 */
const ApprovalRules = () => {
  const { setPageTitle } = useApp();
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [selectedRule, setSelectedRule] = useState<ApprovalRule | undefined>(undefined);

  useEffect(() => {
    setPageTitle('Matriz de Autorización');
  }, []);

  /**
   * Opens the form in create mode and clears any previously selected rule.
   */
  const handleCreate = () => {
    setSelectedRule(undefined);
    setFormMode('create');
  };

  /**
   * Opens the form in edit mode with the selected rule data pre-filled.
   * @param rule The rule to be edited.
   */
  const handleEdit = (rule: ApprovalRule) => {
    setSelectedRule(rule);
    setFormMode('edit');
  };

  /**
   * Closes the form and resets mode and selection state.
   */
  const handleCloseForm = () => {
    setSelectedRule(undefined);
    setFormMode(null);
  };

  return (
    <div className="px-16 pt-32 flex-1 pb-12">
      <div className="max-w-5xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matriz de Autorización</h1>
          <p className="text-sm text-gray-500 mt-1">
            Define las reglas que determinan quién debe aprobar cada tipo de solicitud de viaje.
          </p>
        </div>

        {formMode !== null ? (
          <RuleForm rule={selectedRule} onClose={handleCloseForm} />
        ) : (
          <RuleList onEdit={handleEdit} onCreate={handleCreate} />
        )}

      </div>
    </div>
  );
};

export default ApprovalRules;

/*
 * Modification History:
 * - 2026-04-08 | Juan de Dios Gastélum Flores | Initial file creation.
 */
