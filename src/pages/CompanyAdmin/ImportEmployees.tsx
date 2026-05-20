/**
 * File: ImportEmployees.tsx
 * Description: CompanyAdmin page that orchestrates the employee Excel import flow
 *              (upload + preview + confirm) by composing the companyadmin components
 *              and the usePreviewImport / useConfirmImport mutations.
 */

import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';

import ImportUploader from '../../components/companyadmin/ImportUploader';
import ImportPreviewTable from '../../components/companyadmin/ImportPreviewTable';
import OrgChart from '../../components/companyadmin/OrgChart';
import ImportResultPanel from '../../components/companyadmin/ImportResultPanel';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../hooks/app/appContext';
import { usePreviewImport } from '../../hooks/companyadmin/usePreviewImport';
import { usePreviewImportJson } from '../../hooks/companyadmin/usePreviewImportJson';
import { useConfirmImport } from '../../hooks/companyadmin/useConfirmImport';
import { buildOrgTree } from '../../utils/flatToTree';
import {
  ConfirmEmployee,
  ImportFormat,
  ImportJsonPayload,
  ImportResult,
  PreviewResponse,
} from '../../types/importEmployees';

type Step = 'upload' | 'preview' | 'done';
type PreviewView = 'table' | 'tree';

type ApiErrorBody = { message?: string | string[] };

/**
 * Extracts a user-friendly error message from an Axios error.
 */
const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<ApiErrorBody>;
    const data = axiosError.response?.data;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }
  }
  return fallback;
};

/**
 * Main page component. Coordinates the 3 steps of the import process.
 */
const ImportEmployees = () => {
  const { setPageTitle } = useApp();
  const [step, setStep] = useState<Step>('upload');
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [roleByEmpNo, setRoleByEmpNo] = useState<Record<string, string>>({});
  const [view, setView] = useState<PreviewView>('table');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importFormat, setImportFormat] = useState<ImportFormat>('excel');

  const { mutateAsync: runPreviewExcel, isPending: isPreviewingExcel } =
    usePreviewImport();
  const { mutateAsync: runPreviewJson, isPending: isPreviewingJson } =
    usePreviewImportJson();
  const { mutateAsync: runConfirm, isPending: isConfirming } = useConfirmImport();
  const isPreviewing = isPreviewingExcel || isPreviewingJson;

  useEffect(() => {
    setPageTitle('Importar empleados');
  }, [setPageTitle]);

  const tree = useMemo(
    () => buildOrgTree(preview?.employees ?? []),
    [preview],
  );

  // Filter out admin roles that shouldn't be assignable to employees
  const assignableRoles = useMemo(
    () =>
      (preview?.availableRoles ?? []).filter(
        (role) =>
          role.name !== 'Administrador' &&
          role.name !== 'SuperAdmin' &&
          role.name !== 'Super Admin',
      ),
    [preview],
  );

  const validEmployees = useMemo(
    () =>
      (preview?.employees ?? []).filter(
        (employee) =>
          employee.validationErrors.length === 0 && employee.employeeNumber,
      ),
    [preview],
  );

  const unassignedCount = useMemo(
    () =>
      validEmployees.filter(
        (employee) => !roleByEmpNo[employee.employeeNumber],
      ).length,
    [validEmployees, roleByEmpNo],
  );

  const missingStatusCount = useMemo(
    () =>
      validEmployees.filter(
        (employee) => !employee.availabilityStatus,
      ).length,
    [validEmployees],
  );

  const isReadyToConfirm =
    validEmployees.length > 0 && unassignedCount === 0 && missingStatusCount === 0 && !isConfirming;

  const applyPreviewResponse = (response: PreviewResponse) => {
    setPreview(response);

    // Pre-fill roles from backend suggestion; admin can still change them per row.
    const initialRoles: Record<string, string> = {};
    for (const employee of response.employees) {
      if (
        employee.validationErrors.length === 0 &&
        employee.employeeNumber &&
        employee.suggestedRoleId
      ) {
        initialRoles[employee.employeeNumber] = employee.suggestedRoleId;
      }
    }
    setRoleByEmpNo(initialRoles);

    setStep('preview');
    setView('table');
    toast.success(
      `Vista previa lista: ${response.validRows}/${response.totalRows} filas válidas`,
    );
  };

  const handleUploadExcel = async (file: File) => {
    try {
      const response = await runPreviewExcel(file);
      applyPreviewResponse(response);
    } catch (error) {
      toast.error(
        extractErrorMessage(
          error,
          'No se pudo generar la vista previa del archivo.',
        ),
      );
    }
  };

  const handleUploadJson = async (payload: ImportJsonPayload) => {
    try {
      const response = await runPreviewJson(payload);
      applyPreviewResponse(response);
    } catch (error) {
      toast.error(
        extractErrorMessage(
          error,
          'No se pudo generar la vista previa del archivo.',
        ),
      );
    }
  };

  const handleRoleChange = (employeeNumber: string, roleId: string) => {
    setRoleByEmpNo((prev) => ({ ...prev, [employeeNumber]: roleId }));
  };

  const handleConfirm = async () => {
    if (!preview) return;

    if (unassignedCount > 0) {
      toast.warn(
        `Faltan ${unassignedCount} empleado(s) por asignar rol antes de continuar.`,
      );
      return;
    }

    if (missingStatusCount > 0) {
      toast.warn(
        `Faltan ${missingStatusCount} empleado(s) con estado de disponibilidad antes de continuar.`,
      );
      return;
    }

    const payload: ConfirmEmployee[] = validEmployees.map((employee) => ({
      employeeNumber: employee.employeeNumber,
      name: employee.name,
      lastName: employee.lastName,
      username: employee.username,
      email: employee.email,
      supplierNumber: employee.supplierNumber,
      departmentId: employee.departmentId as string,
      bossEmployeeNumber: employee.bossEmployeeNumber,
      availabilityStatus: employee.availabilityStatus,
      signupDate: employee.signupDate,
      lastchangeDate: employee.lastchangeDate,
      idRole: roleByEmpNo[employee.employeeNumber],
    }));

    try {
      const response = await runConfirm({ employees: payload });
      setResult(response);
      setStep('done');
      toast.success('Importación procesada correctamente.');
    } catch (error) {
      toast.error(
        extractErrorMessage(
          error,
          'No se pudo completar la importación. Intenta de nuevo.',
        ),
      );
    }
  };

  const handleReset = () => {
    setPreview(null);
    setRoleByEmpNo({});
    setResult(null);
    setStep('upload');
  };

  const handleDiscardPreview = () => {
    setPreview(null);
    setRoleByEmpNo({});
    setStep('upload');
  };

  return (
    <div className="px-6 md:px-16 pt-32 flex-1 pb-12">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Importar empleados
          </h1>
          <p className="text-sm text-gray-500">
            Administra el alta masiva de empleados desde un archivo Excel o JSON.
            Revisa la vista previa y asigna el rol correspondiente antes de
            confirmar.
          </p>
        </header>

        <Stepper step={step} />

        {step === 'upload' && (
          <ImportUploader
            format={importFormat}
            onFormatChange={setImportFormat}
            onUploadExcel={handleUploadExcel}
            onUploadJson={handleUploadJson}
            isUploading={isPreviewing}
          />
        )}

        {step === 'preview' && preview && (
          <section className="space-y-6">
            <PreviewSummary
              totalRows={preview.totalRows}
              validRows={preview.validRows}
              errorRows={preview.errorRows}
              unassignedCount={unassignedCount}
              missingStatusCount={missingStatusCount}
            />

            {preview.errorRows > 0 && (
              <ErrorsPanel employees={preview.employees} />
            )}

            <div className="flex items-center gap-2">
              <ViewToggleButton
                label="Tabla"
                active={view === 'table'}
                onClick={() => setView('table')}
              />
              <ViewToggleButton
                label="Organigrama"
                active={view === 'tree'}
                onClick={() => setView('tree')}
              />
            </div>

            {view === 'table' ? (
              <ImportPreviewTable
                employees={preview.employees}
                availableRoles={assignableRoles}
                roleByEmpNo={roleByEmpNo}
                onRoleChange={handleRoleChange}
              />
            ) : (
              <OrgChart
                tree={tree}
                availableRoles={assignableRoles}
                roleByEmpNo={roleByEmpNo}
              />
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleDiscardPreview}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                disabled={isConfirming}
              >
                Descartar y subir otro archivo
              </button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={!isReadyToConfirm}
                className={!isReadyToConfirm ? 'opacity-60 cursor-not-allowed' : ''}
              >
                {isConfirming
                  ? 'Importando...'
                  : `Confirmar importación (${validEmployees.length})`}
              </Button>
            </div>
          </section>
        )}

        {step === 'done' && result && (
          <ImportResultPanel result={result} onReset={handleReset} />
        )}
      </div>
    </div>
  );
};

const Stepper = ({ step }: { step: Step }) => {
  const items: { key: Step; label: string }[] = [
    { key: 'upload', label: '1. Subir archivo' },
    { key: 'preview', label: '2. Revisar y asignar roles' },
    { key: 'done', label: '3. Resultado' },
  ];
  const activeIndex = items.findIndex((item) => item.key === step);

  return (
    <ol className="flex items-center gap-3 text-sm">
      {items.map((item, index) => {
        const isActive = index === activeIndex;
        const isPast = index < activeIndex;
        return (
          <li key={item.key} className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full border ${
                isActive
                  ? 'bg-[var(--blue)] text-white border-[var(--blue)]'
                  : isPast
                    ? 'bg-gray-200 text-gray-700 border-gray-200'
                    : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              {item.label}
            </span>
            {index < items.length - 1 && (
              <span className="w-6 h-px bg-gray-300" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
};

const PreviewSummary = ({
  totalRows,
  validRows,
  errorRows,
  unassignedCount,
  missingStatusCount,
}: {
  totalRows: number;
  validRows: number;
  errorRows: number;
  unassignedCount: number;
  missingStatusCount: number;
}) => (
  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
    <SummaryTag label="Total filas" value={totalRows} tone="gray" />
    <SummaryTag label="Válidas" value={validRows} tone="emerald" />
    <SummaryTag label="Con errores" value={errorRows} tone="red" />
    <SummaryTag
      label="Sin rol asignado"
      value={unassignedCount}
      tone={unassignedCount === 0 ? 'emerald' : 'amber'}
    />
    <SummaryTag
      label="Sin estado"
      value={missingStatusCount}
      tone={missingStatusCount === 0 ? 'emerald' : 'amber'}
    />
  </div>
);

type Tone = 'emerald' | 'amber' | 'red' | 'gray';
const TONE_CLASSES: Record<Tone, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  gray: 'bg-gray-50 text-gray-700 border-gray-200',
};

const SummaryTag = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: Tone;
}) => (
  <div className={`border rounded-lg px-3 py-2 ${TONE_CLASSES[tone]}`}>
    <p className="text-[11px] uppercase tracking-wide font-medium opacity-80">
      {label}
    </p>
    <p className="text-xl font-bold mt-0.5">{value}</p>
  </div>
);

const ViewToggleButton = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
      active
        ? 'bg-[var(--blue)] text-white border-[var(--blue)]'
        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
    }`}
  >
    {label}
  </button>
);

const ErrorsPanel = ({ employees }: { employees: any[] }) => {
  const employeesWithErrors = employees.filter(
    (emp) => emp.validationErrors && emp.validationErrors.length > 0,
  );

  if (employeesWithErrors.length === 0) return null;

  return (
    <div className="border border-red-200 bg-red-50 rounded-lg p-4">
      <h3 className="font-semibold text-red-900 mb-3">
        Errores de validación ({employeesWithErrors.length})
      </h3>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {employeesWithErrors.map((employee, idx) => (
          <div
            key={idx}
            className="border-l-4 border-red-500 bg-white p-3 rounded text-sm"
          >
            <p className="font-medium text-gray-900">
              {employee.name} {employee.lastName}
              {employee.employeeNumber && (
                <span className="text-gray-500 ml-2">
                  (Emp. {employee.employeeNumber})
                </span>
              )}
            </p>
            <ul className="mt-2 space-y-1 text-red-700 text-xs">
              {employee.validationErrors.map((error: string, errorIdx: number) => (
                <li key={errorIdx} className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="text-xs text-red-600 mt-3 italic">
        Corrige estos errores en tu archivo y súbelo nuevamente.
      </p>
    </div>
  );
};

export default ImportEmployees;
