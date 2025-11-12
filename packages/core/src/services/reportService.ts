import type { IncomeByDoctor, PeriodIncomeExpense, CashBalanceSummary } from '../entities/index.js';
import type { RepositoryBundle } from '../repositories/types.js';
import { formatPeriodKey } from '../utils/datetime.js';

export class ReportService {
  constructor(private readonly repositories: RepositoryBundle) {}

  async incomeByPeriod(options: { start: string; end: string; granularity: 'day' | 'month' }): Promise<PeriodIncomeExpense[]> {
    const ledger = await this.repositories.ledger.listByDateRange(options.start, options.end);
    const summary = new Map<string, { income: number; expense: number }>();
    for (const entry of ledger) {
      const key = formatPeriodKey(entry.date, options.granularity);
      const existing = summary.get(key) ?? { income: 0, expense: 0 };
      if (entry.direction === 'in') {
        existing.income += entry.amountYER;
      } else {
        existing.expense += entry.amountYER;
      }
      summary.set(key, existing);
    }
    return Array.from(summary.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([period, values]) => ({ period, incomeYER: values.income, expenseYER: values.expense }));
  }

  async expenseByCategory(options: { start: string; end: string }): Promise<Record<string, number>> {
    const ledger = await this.repositories.ledger.listByDateRange(options.start, options.end);
    const buckets = new Map<string, number>();
    for (const entry of ledger) {
      if (entry.direction === 'out') {
        const key = entry.type;
        buckets.set(key, (buckets.get(key) ?? 0) + entry.amountYER);
      }
    }
    return Object.fromEntries(buckets);
  }

  async netByDoctor(options: { start: string; end: string }): Promise<IncomeByDoctor[]> {
    const sessions = await this.repositories.sessions.list();
    const doctors = await this.repositories.doctors.list();
    const doctorMap = new Map(doctors.map((doctor) => [doctor.id, doctor]));
    const totals = new Map<string, { income: number; costs: number }>();
    for (const session of sessions) {
      const sessionDate = new Date(session.date).getTime();
      if (sessionDate < new Date(options.start).getTime() || sessionDate > new Date(options.end).getTime()) {
        continue;
      }
      totals.set(session.doctorId, {
        income: (totals.get(session.doctorId)?.income ?? 0) + session.feeYER,
        costs: (totals.get(session.doctorId)?.costs ?? 0) +
          session.materials.reduce((sum, material) => sum + material.quantity, 0)
      });
    }
    return Array.from(totals.entries()).map(([doctorId, values]) => {
      const doctor = doctorMap.get(doctorId);
      const share = doctor?.revenueSharePercent ?? 0;
      const net = Math.round(values.income * (share / 100));
      return {
        doctorId,
        doctorName: doctor?.name ?? 'طبيب غير معروف',
        incomeYER: values.income,
        netAfterCostsYER: net - values.costs
      };
    });
  }

  async cashBalance(): Promise<CashBalanceSummary> {
    const ledger = await this.repositories.ledger.list();
    let totalIn = 0;
    let totalOut = 0;
    for (const entry of ledger) {
      if (entry.direction === 'in') {
        totalIn += entry.amountYER;
      } else {
        totalOut += entry.amountYER;
      }
    }
    return {
      balanceYER: totalIn - totalOut,
      totalInYER: totalIn,
      totalOutYER: totalOut
    };
  }
}
