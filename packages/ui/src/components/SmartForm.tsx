import { useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import './styles.css';

export interface SmartFormField<T extends Record<string, any>> {
  name: keyof T;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  options?: { label: string; value: string | number }[];
  placeholder?: string;
  required?: boolean;
  span?: number;
  render?: (value: T[keyof T], onChange: (value: T[keyof T]) => void) => ReactNode;
}

export interface SmartFormProps<T extends Record<string, any>> {
  values: T;
  fields: SmartFormField<T>[];
  onChange: (values: T) => void;
  layout?: 'two' | 'three';
  locale?: 'ar' | 'en';
  onAutoSave?: (values: T) => void;
  autoSaveDelay?: number;
  autoSaveEnabled?: boolean;
}

export function SmartForm<T extends Record<string, any>>({
  values,
  fields,
  onChange,
  layout = 'two',
  locale = 'ar',
  onAutoSave,
  autoSaveDelay = 800,
  autoSaveEnabled = true
}: SmartFormProps<T>) {
  const gridClass = useMemo(() => `mc-grid mc-grid--${layout === 'three' ? 'three' : 'two'}`, [layout]);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitial = useRef(true);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!autoSaveEnabled && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [autoSaveEnabled]);

  useEffect(() => {
    if (!onAutoSave || !autoSaveEnabled) {
      return;
    }
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onAutoSave(values);
    }, autoSaveDelay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [values, onAutoSave, autoSaveEnabled, autoSaveDelay]);

  return (
    <form className="mc-card" dir={dir} data-locale={locale} onSubmit={(event) => event.preventDefault()}>
      <div className={gridClass}>
        {fields.map((field) => {
          const value = values[field.name];
          const updateValue = (next: any) => onChange({ ...values, [field.name]: next });
          return (
            <label key={String(field.name)} className="mc-smart-field" style={{ gridColumn: `span ${field.span ?? 1}` }}>
              <span>{field.label}</span>
              {field.render ? (
                field.render(value, updateValue)
              ) : field.type === 'select' ? (
                <select value={value ?? ''} required={field.required} onChange={(event) => updateValue(event.target.value)}>
                  <option value="">{locale === 'ar' ? 'اختر' : 'Select'}</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={value ?? ''}
                  placeholder={field.placeholder}
                  required={field.required}
                  onChange={(event) => updateValue(event.target.value)}
                />
              ) : (
                <input
                  type={field.type}
                  value={value ?? ''}
                  placeholder={field.placeholder}
                  required={field.required}
                  onChange={(event) => updateValue(field.type === 'number' ? Number(event.target.value) : event.target.value)}
                />
              )}
            </label>
          );
        })}
      </div>
    </form>
  );
}
