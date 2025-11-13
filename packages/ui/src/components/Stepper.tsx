import './styles.css';

export interface StepperStep {
  id: string;
  label: string;
  complete?: boolean;
}

export interface StepperProps {
  steps: StepperStep[];
  activeId: string;
}

export function Stepper({ steps, activeId }: StepperProps) {
  return (
    <ol className="mc-stepper">
      {steps.map((step, index) => {
        const isActive = step.id === activeId;
        return (
          <li key={step.id} className={`mc-stepper__item ${isActive ? 'is-active' : ''} ${step.complete ? 'is-complete' : ''}`}>
            <span className="mc-stepper__circle">{step.complete ? '✓' : index + 1}</span>
            <span className="mc-stepper__label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
