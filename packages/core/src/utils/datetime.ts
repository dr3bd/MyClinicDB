export function toISO(date: Date | string): string {
  if (typeof date === 'string') {
    return new Date(date).toISOString();
  }
  return date.toISOString();
}

export function isWithinNextMonths(date: string, months: number): boolean {
  const target = new Date(date);
  const now = new Date();
  const limit = new Date(now);
  limit.setMonth(limit.getMonth() + months);
  return target >= now && target <= limit;
}

export function formatPeriodKey(date: string, granularity: 'day' | 'month'): string {
  const target = new Date(date);
  if (granularity === 'day') {
    return target.toISOString().slice(0, 10);
  }
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`;
}
