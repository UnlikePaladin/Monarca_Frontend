import { ChangeEvent, useRef, useState } from 'react';

import { toast } from 'react-toastify';

import { Button } from '../ui/Button';

type ImportUploadCardProps = {
  stepTitle: string;
  description: string;
  templateUrl?: string;
  templateLabel?: string;
  columnsHint: string;
  onUpload: (file: File) => void;
  isUploading: boolean;
};

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const ImportUploadCard = ({
  stepTitle,
  description,
  templateUrl,
  templateLabel = 'Descargar plantilla de Excel',
  columnsHint,
  onUpload,
  isUploading,
}: ImportUploadCardProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;

    if (!selected) {
      setFile(null);
      return;
    }

    const lowered = selected.name.toLowerCase();
    const isAllowed = ACCEPTED_EXTENSIONS.some((ext) => lowered.endsWith(ext));

    if (!isAllowed) {
      toast.error('Solo se permiten archivos .xlsx o .xls');
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

  const handleChooseFile = () => {
    inputRef.current?.click();
  };

  const handleUploadClick = () => {
    if (!file) {
      toast.warn('Selecciona un archivo de Excel para continuar');
      return;
    }

    onUpload(file);
  };

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-900">{stepTitle}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Plantilla</p>
          <p className="text-xs text-gray-500">{columnsHint}</p>
          {templateUrl ? (
            <a
              href={templateUrl}
              download
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--blue)] border border-[var(--blue)] rounded-lg hover:bg-[var(--blue)] hover:text-white transition-colors"
            >
              {templateLabel}
            </a>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Archivo</p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Seleccionar archivo de Excel"
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
          <p className="text-xs text-gray-400">Máximo 10 MB. Formato .xlsx o .xls.</p>
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

export default ImportUploadCard;
