import './styles.css';

export interface ToothFDIProps {
  values: Record<number, { label: string; color?: string } | undefined>;
  onSelect: (toothNumber: number) => void;
  interactive?: boolean;
}

const FDI_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38
];

export function ToothFDI({ values, onSelect, interactive = true }: ToothFDIProps) {
  return (
    <div className="mc-fdi">
      {FDI_TEETH.map((number) => {
        const status = values[number];
        return (
          <button
            key={number}
            type="button"
            className="mc-fdi__tooth"
            style={{ backgroundColor: status?.color ?? 'transparent' }}
            onClick={() => interactive && onSelect(number)}
            disabled={!interactive}
          >
            <span>{number}</span>
            {status?.label && <small>{status.label}</small>}
          </button>
        );
      })}
    </div>
  );
}
