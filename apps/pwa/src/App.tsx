import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  AppShell,
  KPIWidget,
  DataTable,
  ChartPanel,
  Tag,
  EmptyState
} from '@myclinicdb/ui';
import { InMemoryRepositoryBundle, applySeed, ReportService, formatYER } from '@myclinicdb/core';
import type { Patient, Appointment, Invoice } from '@myclinicdb/core';

const sections = [
  { id: 'dashboard', label: 'لوحة التحكم' },
  { id: 'patients', label: 'المرضى' },
  { id: 'appointments', label: 'المواعيد' },
  { id: 'billing', label: 'الفوترة' }
];

export default function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [repositories, setRepositories] = useState<InMemoryRepositoryBundle | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const repo = new InMemoryRepositoryBundle();
    applySeed(repo).then(() => setRepositories(repo));
  }, []);

  const reportService = useMemo(() => (repositories ? new ReportService(repositories) : null), [repositories]);

  useEffect(() => {
    if (!repositories) return;
    repositories.patients.list().then(setPatients);
    repositories.appointments.list().then(setAppointments);
    repositories.invoices.list().then(setInvoices);
  }, [repositories]);

  const [dashData, setDashData] = useState({ income: 0, expense: 0, balance: 0 });

  useEffect(() => {
    if (!reportService) return;
    (async () => {
      const balance = await reportService.cashBalance();
      const period = await reportService.incomeByPeriod({
        start: new Date(Date.now() - 6 * 86400000).toISOString(),
        end: new Date().toISOString(),
        granularity: 'day'
      });
      const income = period.reduce((acc, item) => acc + item.incomeYER, 0);
      const expense = period.reduce((acc, item) => acc + item.expenseYER, 0);
      setDashData({ income, expense, balance: balance.balanceYER });
    })();
  }, [reportService]);

  const patientColumns = useMemo<ColumnDef<Patient>[]>(
    () => [
      { header: 'الرمز', accessorKey: 'code' },
      { header: 'الاسم', accessorKey: 'fullNameAr' },
      { header: 'الجوال', accessorKey: 'phone' },
      { header: 'الطبيب', accessorKey: 'doctorId' }
    ],
    []
  );

  const appointmentColumns = useMemo<ColumnDef<Appointment>[]>(
    () => [
      { header: 'المريض', accessorKey: 'patientId' },
      { header: 'الطبيب', accessorKey: 'doctorId' },
      { header: 'بداية', accessorKey: 'start' },
      { header: 'نهاية', accessorKey: 'end' },
      { header: 'الحالة', accessorKey: 'status' }
    ],
    []
  );

  const invoiceColumns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      { header: 'المريض', accessorKey: 'patientId' },
      { header: 'التاريخ', accessorKey: 'date' },
      {
        header: 'الإجمالي',
        cell: ({ row }) => formatYER(row.original.totalYER),
        accessorKey: 'totalYER'
      },
      {
        header: 'المدفوع',
        cell: ({ row }) => formatYER(row.original.paidYER),
        accessorKey: 'paidYER'
      },
      {
        header: 'الحالة',
        cell: ({ row }) => <Tag tone={row.original.status === 'paid' ? 'success' : 'warning'}>{row.original.status}</Tag>,
        accessorKey: 'status'
      }
    ],
    []
  );

  const [chartState, setChartState] = useState<{ labels: string[]; datasets: any[] }>({ labels: [], datasets: [] });

  useEffect(() => {
    if (!reportService) return;
    reportService
      .incomeByPeriod({
        start: new Date(Date.now() - 14 * 86400000).toISOString(),
        end: new Date().toISOString(),
        granularity: 'day'
      })
      .then((items) =>
        setChartState({
          labels: items.map((item) => item.period),
          datasets: [
            {
              label: 'الدخل',
              data: items.map((item) => item.incomeYER),
              borderColor: '#0c8a8a',
              backgroundColor: 'rgba(12, 138, 138, 0.2)'
            },
            {
              label: 'المصروف',
              data: items.map((item) => item.expenseYER),
              borderColor: '#dc2626',
              backgroundColor: 'rgba(220, 38, 38, 0.2)'
            }
          ]
        })
      );
  }, [reportService]);

  return (
    <AppShell
      brand={<span>MyClinicDB</span>}
      sidebarItems={sections.map((section) => ({
        id: section.id,
        label: section.label,
        active: section.id === activeSection,
        onClick: () => setActiveSection(section.id)
      }))}
    >
      {activeSection === 'dashboard' && (
        <div className="mc-grid mc-grid--two">
          <KPIWidget label="إجمالي الدخل" value={formatYER(dashData.income)} />
          <KPIWidget label="إجمالي المصروف" value={formatYER(dashData.expense)} trend="down" />
          <KPIWidget label="رصيد الخزنة" value={formatYER(dashData.balance)} trend="up" />
          <ChartPanel title="الأداء الأسبوعي" data={chartState as any} chart="line" />
        </div>
      )}
      {activeSection === 'patients' && (
        <DataTable data={patients ?? []} columns={patientColumns} locale="ar" />
      )}
      {activeSection === 'appointments' && (
        <DataTable data={appointments ?? []} columns={appointmentColumns} locale="ar" />
      )}
      {activeSection === 'billing' && (
        <DataTable data={invoices ?? []} columns={invoiceColumns} locale="ar" />
      )}
      {!repositories && <EmptyState title="جاري التحميل" description="انتظر لحظات ليتم تجهيز البيانات" />}
    </AppShell>
  );
}
