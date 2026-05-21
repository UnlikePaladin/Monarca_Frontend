type StepItem = {
  key: string;
  label: string;
};

type ImportStepperProps = {
  steps: StepItem[];
  activeStep: string;
};

const ImportStepper = ({ steps, activeStep }: ImportStepperProps) => {
  const activeIndex = steps.findIndex((step) => step.key === activeStep);

  return (
    <ol className="flex items-center gap-3 text-sm flex-wrap">
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isPast = index < activeIndex;

        return (
          <li key={step.key} className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full border ${
                isActive
                  ? 'bg-[var(--blue)] text-white border-[var(--blue)]'
                  : isPast
                    ? 'bg-gray-200 text-gray-700 border-gray-200'
                    : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <span className="w-6 h-px bg-gray-300" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default ImportStepper;
