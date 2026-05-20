/**
 * File: ImportUploader.tsx
 * Description: Step 1 of the employee import flow. Lets the CompanyAdmin choose
 *              between Excel and JSON formats, download the matching template
 *              and pick a local file to preview.
 */

import { ChangeEvent, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Button } from '../ui/Button';
import {
  ImportFormat,
  ImportJsonEmployee,
  ImportJsonPayload,
} from '../../types/importEmployees';

const EXCEL_ACCEPTED_EXTENSIONS = ['.xlsx', '.xls'];
const JSON_ACCEPTED_EXTENSIONS = ['.json'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const EXCEL_TEMPLATE_URL = '/templates/plantilla-empleados.xlsx';
const JSON_TEMPLATE_URL = '/templates/plantilla-empleados.json';

type ImportUploaderProps = {
  format: ImportFormat;
  onFormatChange: (format: ImportFormat) => void;
  onUploadExcel: (file: File) => void;
  onUploadJson: (payload: ImportJsonPayload) => void;
  isUploading: boolean;
};

type FormatTabProps = {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
};

const FormatTab = ({ label, active, disabled, onClick }: FormatTabProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
      active
        ? 'bg-[var(--blue)] text-white border-[var(--blue)]'
        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
    } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    {label}
  </button>
);

/**
 * Reads the picked .json file, parses it and normalizes it to ImportJsonPayload.
 * Accepts either `{ "employees": [...] }` or a raw array `[...]`.
 */
const readJsonFile = (file: File): Promise<ImportJsonPayload> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo JSON'));
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '');
        const parsed: unknown = JSON.parse(text);
        const employees = Array.isArray(parsed)
          ? (parsed as ImportJsonEmployee[])
          : (parsed as { employees?: ImportJsonEmployee[] })?.employees;

        if (!Array.isArray(employees) || employees.length === 0) {
          reject(
            new Error(
              'El JSON debe contener un arreglo "employees" con al menos un empleado.',
            ),
          );
          return;
        }
        resolve({ employees });
      } catch (error) {
        reject(
          error instanceof Error
            ? new Error(`JSON inválido: ${error.message}`)
            : new Error('JSON inválido'),
        );
      }
    };
    reader.readAsText(file);
  });

/**
 * Renders the format selector, template download button and the file picker
 * for either Excel or JSON imports.
 */
const ImportUploader = ({
  format,
  onFormatChange,
  onUploadExcel,
  onUploadJson,
  isUploading,
}: ImportUploaderProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const acceptedExtensions =
    format === 'excel' ? EXCEL_ACCEPTED_EXTENSIONS : JSON_ACCEPTED_EXTENSIONS;
  const acceptAttr = acceptedExtensions.join(',');
  const templateUrl =
    format === 'excel' ? EXCEL_TEMPLATE_URL : JSON_TEMPLATE_URL;
  const templateLabel =
    format === 'excel'
      ? 'Descargar plantilla de Excel'
      : 'Descargar plantilla JSON';

  const handleFormatChange = (next: ImportFormat) => {
    if (next === format || isUploading) return;
    onFormatChange(next);
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    if (!selected) {
      setFile(null);
      return;
    }

    const lowered = selected.name.toLowerCase();
    const isAllowed = acceptedExtensions.some((ext) => lowered.endsWith(ext));
    if (!isAllowed) {
      toast.error(
        format === 'excel'
          ? 'Solo se permiten archivos .xlsx o .xls'
          : 'Solo se permiten archivos .json',
      );
      event.target.value = '';
      setFile(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      toast.error('El archivo excede el tamaño máximo de 10 MB');
      event.target.value = '';
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const handleUploadClick = async () => {
    if (!file) {
      toast.warn(
        format === 'excel'
          ? 'Selecciona un archivo de Excel para continuar'
          : 'Selecciona un archivo JSON para continuar',
      );
      return;
    }

    if (format === 'excel') {
      onUploadExcel(file);
      return;
    }

    try {
      const payload = await readJsonFile(file);
      onUploadJson(payload);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo leer el archivo JSON',
      );
    }
  };

  const handleChooseFile = () => {
    inputRef.current?.click();
  };

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-900">
          1. Cargar archivo de empleados
        </h2>
        <p className="text-sm text-gray-500">
          Elige el formato, descarga la plantilla y súbela para obtener una
          vista previa antes de confirmar la importación.
        </p>
      </header>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Formato</p>
        <div className="flex items-center gap-2">
          <FormatTab
            label="Excel"
            active={format === 'excel'}
            disabled={isUploading}
            onClick={() => handleFormatChange('excel')}
          />
          <FormatTab
            label="JSON"
            active={format === 'json'}
            disabled={isUploading}
            onClick={() => handleFormatChange('json')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Plantilla</p>
          <p className="text-xs text-gray-500">
            Campos requeridos: NoEmpleado, Nombre, Usuario, Email, Ceco, Jefe
            Inmediato, Proveedor, status, FechaAlta, FechaCambio.
          </p>
          <a
            href={templateUrl}
            download
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--blue)] border border-[var(--blue)] rounded-lg hover:bg-[var(--blue)] hover:text-white transition-colors"
          >
            {templateLabel}
          </a>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Archivo</p>
          <input
            ref={inputRef}
            type="file"
            accept={acceptAttr}
            onChange={handleFileChange}
            className="hidden"
            aria-label={
              format === 'excel'
                ? 'Seleccionar archivo de Excel'
                : 'Seleccionar archivo JSON'
            }
          />
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleChooseFile}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              disabled={isUploading}
            >
              Seleccionar archivo
            </button>
            <span
              className="text-xs text-gray-600 truncate max-w-[220px]"
              title={file?.name}
            >
              {file ? file.name : 'Ningún archivo seleccionado'}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Máximo 10 MB. Formato {acceptedExtensions.join(' o ')}.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleUploadClick}
          disabled={!file || isUploading}
          className={!file || isUploading ? 'opacity-60 cursor-not-allowed' : ''}
        >
          {isUploading ? 'Procesando...' : 'Generar vista previa'}
        </Button>
      </div>
    </section>
  );
};

export default ImportUploader;
