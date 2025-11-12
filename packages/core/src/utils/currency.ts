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
  assertIntegerYER(value);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: YER_CODE,
    currencyDisplay: 'code',
    maximumFractionDigits: 0
  }).format(value);
}

export function getCurrencyCode(): string {
  return YER_CODE;
}
