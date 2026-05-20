import { useEffect, useMemo, useState } from 'react';

import { AxiosError } from 'axios';
import { toast } from 'react-toastify';

import ImportStepper from '../../components/imports/ImportStepper';
import ImportUploadCard from '../../components/imports/ImportUploadCard';
import ImportPreviewTable from '../../components/imports/ImportPreviewTable';
import ImportResultPanel from '../../components/imports/ImportResultPanel';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../hooks/app/appContext';
import { useExcelImportPreview } from '../../hooks/imports/useExcelImportPreview';
import { useExcelImportConfirm } from '../../hooks/imports/useExcelImportConfirm';
import {
  normalizeImportResult,
  normalizePreviewResponse,
  normalizeValidationMessages,
  stripImportMetadata,
} from '../../utils/excelImport';
import type {
  CostCenterImportConfirmPayload,
  CostCenterImportPreviewResponse,
  CostCenterImportPreviewRow,
  CostCenterImportResult,
} from '../../types/importCostCenters';

type Step = 'upload' | 'preview' | 'done';
type ApiErrorBody = { message?: string | string[] };

const TEMPLATE_URL = '/templates/plantilla-centros-costos.xlsx';
const previewFields = {
  numericId: 'ID numérico',
  key: 'Clave',
  name: 'Nombre',
};

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

const normalizeRows = (rows: CostCenterImportPreviewRow[]) =>
  rows.map((row) => ({
    ...row,
    validationErrors: normalizeValidationMessages(row.validationErrors ?? row.errors),
  }));

const ImportCostCenters = () => {
  const { setPageTitle } = useApp();
  const [step, setStep] = useState<Step>('upload');
  const [preview, setPreview] = useState<CostCenterImportPreviewResponse | null>(null);
  const [result, setResult] = useState<CostCenterImportResult | null>(null);

  const previewEndpoint = '/cost-centers/import/preview';
  const confirmEndpoint = '/cost-centers/import/confirm';

  const { mutateAsync: runPreview, isPending: isPreviewing } = useExcelImportPreview<CostCenterImportPreviewResponse>(
    previewEndpoint,
  );
  const { mutateAsync: runConfirm, isPending: isConfirming } = useExcelImportConfirm<
    CostCenterImportConfirmPayload,
    CostCenterImportResult
  >(confirmEndpoint, [['costCenters']]);

  useEffect(() => {
    setPageTitle('Importar centros de costos');
  }, [setPageTitle]);

  const rows = useMemo(() => normalizeRows(preview?.rows ?? []), [preview]);
  const validRows = useMemo(
    () => rows.filter((row) => normalizeValidationMessages(row.validationErrors).length === 0),
    [rows],
  );

  const handleUpload = async (file: File) => {
    try {
      const response = normalizePreviewResponse<CostCenterImportPreviewRow>(
        await runPreview(file),
        ['rows', 'costCenters', 'data'],
      );
      setPreview(response);
      setStep('preview');
      toast.success(`Vista previa lista: ${response.validRows}/${response.totalRows} filas válidas`);
    } catch (error) {
      toast.error(extractErrorMessage(error, 'No se pudo generar la vista previa del archivo.'));
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;

    const payload: CostCenterImportConfirmPayload = {
      costCenters: validRows.map((row) => stripImportMetadata(row)),
    };

    try {
      const response = normalizeImportResult(await runConfirm(payload));
      setResult(response);
      setStep('done');
      toast.success('Importación procesada correctamente.');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'No se pudo completar la importación. Intenta de nuevo.'));
    }
  };

  const handleReset = () => {
    setPreview(null);
    setResult(null);
    setStep('upload');
  };

  return (
    <div className="px-6 md:px-16 pt-32 flex-1 pb-12">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Importar centros de costos</h1>
          <p className="text-sm text-gray-500">
            Sube un archivo Excel, revisa la validación por fila y confirma solo los centros
            de costos correctos.
          </p>
        </header>

        <ImportStepper
          activeStep={step}
          steps={[
            { key: 'upload', label: '1. Subir archivo' },
            { key: 'preview', label: '2. Revisar y confirmar' },
            { key: 'done', label: '3. Resultado' },
          ]}
        />

        {step === 'upload' && (
          <ImportUploadCard
            stepTitle="1. Cargar archivo de centros de costos"
            description="Descarga la plantilla, completa la información y súbela para obtener una vista previa antes de confirmar."
            templateUrl={TEMPLATE_URL}
            columnsHint="Columnas en plantilla: ID numérico, Clave, Nombre, Descripción."
            onUpload={handleUpload}
            isUploading={isPreviewing}
          />
        )}

        {step === 'preview' && preview && (
          <section className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SummaryTag label="Total filas" value={preview.totalRows} tone="gray" />
              <SummaryTag label="Válidas" value={preview.validRows} tone="emerald" />
              <SummaryTag label="Con errores" value={preview.errorRows} tone="red" />
              <SummaryTag
                label="Listas para confirmar"
                value={validRows.length}
                tone={validRows.length === 0 ? 'amber' : 'emerald'}
              />
            </div>

            <ImportPreviewTable<CostCenterImportPreviewRow>
              rows={rows}
              columns={[
                { header: 'ID numérico', render: (row) => row.numericId ?? '—' },
                { header: 'Clave', render: (row) => row.key ?? '—' },
                { header: 'Nombre', render: (row) => row.name ?? '—' },
              ]}
              emptyMessage="No hay centros de costos en el archivo."
              getRowKey={(row) => `${row.row}-${row.name}`}
              fieldLabels={previewFields}
              getValidationErrors={(row) => row.validationErrors}
            />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                disabled={isConfirming}
              >
                Descartar y subir otro archivo
              </button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={validRows.length === 0 || isConfirming}
                className={validRows.length === 0 || isConfirming ? 'opacity-60 cursor-not-allowed' : ''}
              >
                {isConfirming ? 'Importando...' : `Confirmar importación (${validRows.length})`}
              </Button>
            </div>
          </section>
        )}

        {step === 'done' && result && (
          <ImportResultPanel
            title="Importación completada"
            description="Se procesaron los centros de costos validados del archivo."
            result={result}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
};

const SummaryTag = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'emerald' | 'amber' | 'red' | 'gray';
}) => {
  const toneClasses: Record<'emerald' | 'amber' | 'red' | 'gray', string> = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <div className={`border rounded-lg px-3 py-2 ${toneClasses[tone]}`}>
      <p className="text-[11px] uppercase tracking-wide font-medium opacity-80">{label}</p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
    </div>
  );
};

export default ImportCostCenters;
