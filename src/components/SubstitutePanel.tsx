/**
 * Description: Component to configure temporary role delegations to another user.
 */

import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import  Select from './ui/Select';
import FieldError from './ui/FieldError';

const MOCK_USERS = [
  { id: 'usr_1', name: 'Ana Silva (Finanzas)' },
  { id: 'usr_2', name: 'Carlos Mendoza (Operaciones)' },
];

interface FormData {
  targetUserId: string;
  startDate: string;
  endDate: string;
  notes: string;
}

/**
 * Renders a form to select a substitute user and date range for delegations.
 * @returns React component containing the delegation form.
 */
export const SubstitutePanel = () => {
  const [formData, setFormData] = useState<FormData>({
    targetUserId: '',
    startDate: '',
    endDate: '',
    notes: '',
  });
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Validates form dates and submits the delegation request.
   * @param event The form submission event.
   */
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (end < start) {
      setErrorMessage('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }

    // TODO: replace with API call → POST /substitutes
    // useCreateSubstitute.mutate(formData)
  };

  return (
    <div className="max-w-md bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Configurar Sustituto Temporal</h3>
      <p className="text-sm text-gray-500 mb-6">
        Delega tus permisos de aprobación a otro usuario durante tu ausencia.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Usuario Sustituto
          </label>
          <Select
            options={MOCK_USERS}
            value={selectedUser}
            placeholder="Seleccionar usuario..."
            onChange={(option) => {
              setSelectedUser(option);
              setFormData({ ...formData, targetUserId: option.id as string });
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
            <Input
              type="date"
              value={formData.startDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(event) => setFormData({ ...formData, startDate: event.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
            <Input
              type="date"
              value={formData.endDate}
              min={formData.startDate || new Date().toISOString().split('T')[0]}
              onChange={(event) => setFormData({ ...formData, endDate: event.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <Input
            type="text"
            value={formData.notes}
            placeholder="Motivo de la ausencia..."
            onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
          />
        </div>

        {errorMessage && <FieldError msg={errorMessage} />}

        <div className="pt-4">
          <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700">
            Activar Delegación
          </Button>
        </div>
      </form>
    </div>
  );
};

/**
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 */
