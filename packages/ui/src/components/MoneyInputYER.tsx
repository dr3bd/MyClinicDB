import { useMemo } from 'react';
import { formatYER, assertIntegerYER } from '@myclinicdb/core';

export interface MoneyInputYERProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  locale?: 'ar' | 'en';
  readOnly?: boolean;
}

export function MoneyInputYER({ value, onChange, label, locale = 'ar', readOnly }: MoneyInputYERProps) {
  const formatted = useMemo(() => {
    try {
      return formatYER(value, locale === 'ar' ? 'ar-YE' : 'en-US');
    } catch (error) {
      return `${value} YER`;
    }
  }, [value, locale]);

  return (
    <label className="mc-money-input">
      {label && <span>{label}</span>}
      <input
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={value}
        readOnly={readOnly}
        onChange={(event) => {
          const next = Number(event.target.value);
          assertIntegerYER(next);
          onChange(next);
        }}
      />
      <span className="mc-money-input__formatted">{formatted}</span>
    </label>
  );
}
