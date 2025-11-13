const BLOCKED_TOKENS = ['tax', 'vat', 'wht'];

function containsBlockedToken(key: string): boolean {
  const normalized = key.toLowerCase();
  for (const token of BLOCKED_TOKENS) {
    const pattern = new RegExp(`(^|[^a-z])${token}([^a-z]|$)`, 'i');
    if (pattern.test(`_${normalized}_`)) {
      return true;
    }
  }
  return false;
}

export function ensureNoTaxFields(payload: unknown, path = ''): void {
  if (payload === null || payload === undefined) {
    return;
  }
  if (Array.isArray(payload)) {
    payload.forEach((value, index) => ensureNoTaxFields(value, `${path}[${index}]`));
    return;
  }
  if (typeof payload !== 'object') {
    return;
  }

  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (containsBlockedToken(key)) {
      throw new Error('النظام لا يدعم أي حقول أو معاملات ضريبية.');
    }
    if (key.toLowerCase().includes('currency')) {
      const code = typeof value === 'string' ? value.toUpperCase() : value;
      if (code && code !== 'YER') {
        throw new Error('النظام يدعم الريال اليمني فقط.');
      }
    }
    ensureNoTaxFields(value, path ? `${path}.${key}` : key);
  }
}

