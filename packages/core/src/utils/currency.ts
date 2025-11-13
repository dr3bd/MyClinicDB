const YER_CODE = 'YER';

export const CURRENCY_LABEL_AR = 'الريال اليمني';

export function enforceYERCode(code: string): void {
  if (code.toUpperCase() !== YER_CODE) {
    throw new Error('النظام يدعم الريال اليمني فقط.');
  }
}

export function assertIntegerYER(value: number): void {
  if (!Number.isInteger(value)) {
    throw new Error('جميع المبالغ يجب أن تكون أعدادًا صحيحة بالريال اليمني.');
  }
  if (value < 0) {
    throw new Error('قيمة المبلغ بالريال اليمني يجب ألا تكون سالبة.');
  }
}

export function formatYER(value: number, locale: string = 'ar-YE'): string {
  if (!Number.isInteger(value)) {
    throw new Error('جميع المبالغ يجب أن تكون أعدادًا صحيحة بالريال اليمني.');
  }
  const isNegative = value < 0;
  const absoluteValue = Math.abs(value);
  const formatter = new Intl.NumberFormat(locale, {
    style: 'decimal',
    maximumFractionDigits: 0,
    useGrouping: true
  });
  const formatted = formatter.format(absoluteValue);
  const sign = isNegative ? (locale.startsWith('ar') ? '−' : '-') : '';
  if (locale.startsWith('ar')) {
    return `${sign}${formatted} ريال يمني`;
  }
  return `${sign}${formatted} YER`;
}

export function getCurrencyCode(): string {
  return YER_CODE;
}
