import { Button } from '../ui/Button';

type ImportResultError = {
  row?: number | string | null;
  identifier?: string | null;
  field?: string | null;
  message: string;
};

type ImportResultPanelProps = {
  title: string;
  description: string;
  result: {
    created: number;
    updated: number;
    errors: ImportResultError[];
  };
  onReset: () => void;
  resetLabel?: string;
};

type SummaryTone = 'emerald' | 'amber' | 'red' | 'gray';

const TONE_CLASSES: Record<SummaryTone, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  gray: 'bg-gray-50 text-gray-700 border-gray-200',
};

const ImportResultPanel = ({
  title,
  description,
  result,
  onReset,
  resetLabel = 'Importar otro archivo',
}: ImportResultPanelProps) => {
  const hasErrors = result.errors.length > 0;

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Creados" value={result.created} tone="emerald" />
        <SummaryCard label="Actualizados" value={result.updated} tone="amber" />
        <SummaryCard
          label="Errores"
          value={result.errors.length}
          tone={hasErrors ? 'red' : 'gray'}
        />
      </div>

      {hasErrors && (
        <div className="border border-red-200 rounded-lg overflow-hidden">
          <div className="bg-red-50 px-4 py-2 text-sm font-medium text-red-800">
            Errores al confirmar
          </div>
          <ul className="divide-y divide-red-100">
            {result.errors.map((error, index) => (
              <li
                key={`${error.row ?? error.identifier ?? 'row'}-${index}`}
                className="px-4 py-2 text-sm text-red-700 bg-white"
              >
                <span className="font-semibold">
                  {error.row ? `Fila ${error.row}` : error.identifier || 'Registro'}:
                </span>{' '}
                {error.field ? `${error.field} - ` : ''}
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="button" onClick={onReset}>
          {resetLabel}
        </Button>
      </div>
    </section>
  );
};

const SummaryCard = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: SummaryTone;
}) => (
  <div className={`border rounded-xl px-4 py-3 ${TONE_CLASSES[tone]}`}>
    <p className="text-xs uppercase tracking-wide font-medium opacity-80">{label}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

export default ImportResultPanel;
