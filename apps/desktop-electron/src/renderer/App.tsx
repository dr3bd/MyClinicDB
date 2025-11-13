import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppShell,
  EmptyState,
  type DashboardViewProps,
  type PatientsViewProps,
  type AppointmentsViewProps,
  type BillingViewProps,
  type SessionsViewProps,
  type InventoryViewProps,
  type LabOrdersViewProps,
  type SuppliersViewProps,
  type AccountingViewProps,
  type ReportsViewProps,
  type SettingsViewProps,
  type AuditLogViewProps,
  type DashboardAlert
} from '@myclinicdb/ui';
import type { ChartData } from 'chart.js';
import {
  InMemoryRepositoryBundle,
  applySeed,
  ReportService,
  PermissionService,
  InventoryService,
  AuditService,
  InvoiceService,
  CashboxService,
  type UserRole,
  type InventoryItem,
  type InventoryBatch,
  type Supplier,
  type LabOrder,
  type LedgerEntry,
  type Receipt,
  type PaymentVoucher,
  type Doctor,
  type ToothStatus,
  type AuditLog,
  type PeriodIncomeExpense,
  type IncomeByDoctor,
  type CashBalanceSummary,
  type SoonToExpireItem,
  formatYER
} from '@myclinicdb/core';

const DashboardView = lazy(() => import('@myclinicdb/ui/views').then((mod) => ({ default: mod.DashboardView })));
const PatientsView = lazy(() => import('@myclinicdb/ui/views').then((mod) => ({ default: mod.PatientsView })));
const AppointmentsView = lazy(() => import('@myclinicdb/ui/views').then((mod) => ({ default: mod.AppointmentsView })));
const BillingView = lazy(() => import('@myclinicdb/ui/views').then((mod) => ({ default: mod.BillingView })));
const SessionsView = lazy(() => import('@myclinicdb/ui/views').then((mod) => ({ default: mod.SessionsView })));
const InventoryView = lazy(() => import('@myclinicdb/ui/views').then((mod) => ({ default: mod.InventoryView })));
const LabOrdersView = lazy(() => import('@myclinicdb/ui/views').then((mod) => ({ default: mod.LabOrdersView })));
const SuppliersView = lazy(() => import('@myclinicdb/ui/views').then((mod) => ({ default: mod.SuppliersView })));
const AccountingView = lazy(() => import('@myclinicdb/ui/views').then((mod) => ({ default: mod.AccountingView })));
const ReportsView = lazy(() => import('@myclinicdb/ui/views').then((mod) => ({ default: mod.ReportsView })));
const SettingsView = lazy(() => import('@myclinicdb/ui/views').then((mod) => ({ default: mod.SettingsView })));
const AuditLogView = lazy(() => import('@myclinicdb/ui/views').then((mod) => ({ default: mod.AuditLogView })));

type SearchResult = {
  id: string;
  label: string;
  detail: string;
  section: string;
};

const sections = [
  { id: 'dashboard', label: 'لوحة التحكم' },
  { id: 'patients', label: 'المرضى' },
  { id: 'appointments', label: 'المواعيد' },
  { id: 'sessions', label: 'الجلسات' },
  { id: 'billing', label: 'الفوترة' },
  { id: 'inventory', label: 'المخزون' },
  { id: 'lab', label: 'المعامل' },
  { id: 'suppliers', label: 'المورّدون' },
  { id: 'accounting', label: 'الحسابات' },
  { id: 'reports', label: 'التقارير' },
  { id: 'settings', label: 'الإعدادات' },
  { id: 'audit', label: 'سجل التدقيق' }
];

const PLATFORM = 'desktop';

export default function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [locale, setLocale] = useState<'ar' | 'en'>('ar');
  const [role] = useState<UserRole>('manager');
  const [repositories, setRepositories] = useState<InMemoryRepositoryBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<SearchResult[]>([]);

  const permissionService = useMemo(() => new PermissionService(() => role), [role]);
  const auditService = useMemo(
    () => (repositories ? new AuditService(repositories, () => PLATFORM) : null),
    [repositories]
  );
  const inventoryService = useMemo(
    () => (repositories && auditService ? new InventoryService(repositories, auditService, permissionService) : null),
    [repositories, auditService, permissionService]
  );
  const invoiceService = useMemo(
    () => (repositories && auditService ? new InvoiceService(repositories, auditService, permissionService) : null),
    [repositories, auditService, permissionService]
  );
  const cashboxService = useMemo(
    () =>
      repositories && auditService && invoiceService
        ? new CashboxService(repositories, auditService, invoiceService, permissionService)
        : null,
    [repositories, auditService, invoiceService, permissionService]
  );
  const reportService = useMemo(
    () => (repositories ? new ReportService(repositories, permissionService) : null),
    [repositories, permissionService]
  );

  const [patients, setPatients] = useState<PatientsViewProps['patients']>([]);
  const [appointments, setAppointments] = useState<AppointmentsViewProps['appointments']>([]);
  const [sessions, setSessions] = useState<SessionsViewProps['sessions']>([]);
  const [invoices, setInvoices] = useState<BillingViewProps['invoices']>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryBatches, setInventoryBatches] = useState<InventoryBatch[]>([]);
  const [soonToExpire, setSoonToExpire] = useState<SoonToExpireItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrdersViewProps['labOrders']>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [paymentVouchers, setPaymentVouchers] = useState<PaymentVoucher[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [toothStatuses, setToothStatuses] = useState<ToothStatus[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [dashMetrics, setDashMetrics] = useState<DashboardViewProps['metrics']>({
    incomeYER: 0,
    expenseYER: 0,
    balanceYER: 0
  });
  const [chartState, setChartState] = useState<ChartData<'line'>>({ labels: [], datasets: [] });
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [reportPeriod, setReportPeriod] = useState<PeriodIncomeExpense[]>([]);
  const [reportCategories, setReportCategories] = useState<Record<string, number>>({});
  const [reportDoctors, setReportDoctors] = useState<IncomeByDoctor[]>([]);
  const [cashSummary, setCashSummary] = useState<CashBalanceSummary>({
    balanceYER: 0,
    totalInYER: 0,
    totalOutYER: 0
  });

  useEffect(() => {
    const repo = new InMemoryRepositoryBundle();
    applySeed(repo).then(() => setRepositories(repo));
  }, []);

  const loadAllData = useCallback(async () => {
    if (!repositories) {
      return;
    }
    setLoading(true);
    try {
      const [
        patientsList,
        appointmentsList,
        sessionsList,
        invoicesList,
        inventoryItemsList,
        inventoryBatchesList,
        suppliersList,
        labOrdersList,
        ledgerList,
        receiptsList,
        paymentsList,
        doctorsList,
        toothStatusesList,
        auditLogsList
      ] = await Promise.all([
        repositories.patients.list(),
        repositories.appointments.list(),
        repositories.sessions.list(),
        repositories.invoices.list(),
        repositories.inventoryItems.list(),
        repositories.inventoryBatches.list(),
        repositories.suppliers.list(),
        repositories.labOrders.list(),
        repositories.ledger.list(),
        repositories.receipts.list(),
        repositories.paymentVouchers.list(),
        repositories.doctors.list(),
        repositories.toothStatuses.list(),
        repositories.auditLogs.list()
      ]);

      const doctorMap = new Map(doctorsList.map((doctor) => [doctor.id, doctor]));
      const patientMap = new Map(patientsList.map((patient) => [patient.id, patient]));
      const invoiceOutstanding = new Map<string, number>();
      for (const invoice of invoicesList) {
        const remaining = Math.max(0, invoice.totalYER - invoice.paidYER);
        invoiceOutstanding.set(invoice.patientId, (invoiceOutstanding.get(invoice.patientId) ?? 0) + remaining);
      }
      const sessionsCount = new Map<string, number>();
      for (const session of sessionsList) {
        sessionsCount.set(session.patientId, (sessionsCount.get(session.patientId) ?? 0) + 1);
      }

      const patientRows: PatientsViewProps['patients'] = patientsList.map((patient) => ({
        ...patient,
        doctorName: patient.doctorId ? doctorMap.get(patient.doctorId)?.name : undefined,
        sessionsCount: sessionsCount.get(patient.id) ?? 0,
        outstandingYER: invoiceOutstanding.get(patient.id) ?? 0
      }));
      setPatients(patientRows);

      const appointmentRows: AppointmentsViewProps['appointments'] = appointmentsList.map((appointment) => ({
        ...appointment,
        patientName:
          patientMap.get(appointment.patientId)?.fullNameAr ?? patientMap.get(appointment.patientId)?.fullNameEn ??
          appointment.patientId,
        doctorName: doctorMap.get(appointment.doctorId)?.name ?? appointment.doctorId,
        clinicRoom: appointment.room
      }));
      setAppointments(appointmentRows);

      const sessionRows: SessionsViewProps['sessions'] = sessionsList.map((session) => ({
        ...session,
        patientName:
          patientMap.get(session.patientId)?.fullNameAr ?? patientMap.get(session.patientId)?.fullNameEn ?? session.patientId,
        doctorName: doctorMap.get(session.doctorId)?.name ?? session.doctorId
      }));
      setSessions(sessionRows);

      const invoiceRows: BillingViewProps['invoices'] = invoicesList.map((invoice) => ({
        ...invoice,
        patientName:
          patientMap.get(invoice.patientId)?.fullNameAr ?? patientMap.get(invoice.patientId)?.fullNameEn ?? invoice.patientId,
        outstandingYER: Math.max(0, invoice.totalYER - invoice.paidYER)
      }));
      setInvoices(invoiceRows);

      const labRows: LabOrdersViewProps['labOrders'] = labOrdersList.map((order) => ({
        ...order,
        patientName:
          patientMap.get(order.patientId)?.fullNameAr ?? patientMap.get(order.patientId)?.fullNameEn ?? order.patientId,
        doctorName: doctorMap.get(order.doctorId)?.name ?? order.doctorId
      }));
      setLabOrders(labRows);

      setSuppliers(suppliersList);
      setInventoryItems(inventoryItemsList);
      setInventoryBatches(inventoryBatchesList);
      setLedgerEntries([...ledgerList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setReceipts([...receiptsList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setPaymentVouchers([...paymentsList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setDoctors(doctorsList);
      setToothStatuses(toothStatusesList);
      setAuditLogs([...auditLogsList].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

      if (inventoryService) {
        try {
          const alertsList = await inventoryService.soonToExpire(6);
          setSoonToExpire(alertsList);
        } catch (error) {
          console.error(error);
          setSoonToExpire([]);
        }
      }

      if (reportService) {
        const end = new Date();
        const start = new Date(end.getTime() - 30 * 86400000);
        const [period, categories, doctorsNet, summary] = await Promise.all([
          reportService.incomeByPeriod({ start: start.toISOString(), end: end.toISOString(), granularity: 'day' }),
          reportService.expenseByCategory({ start: start.toISOString(), end: end.toISOString() }),
          reportService.netByDoctor({ start: start.toISOString(), end: end.toISOString() }),
          reportService.cashBalance()
        ]);
        setReportPeriod(period);
        setReportCategories(categories);
        setReportDoctors(doctorsNet);
        setCashSummary(summary);
        const income = period.reduce((acc, item) => acc + item.incomeYER, 0);
        const expense = period.reduce((acc, item) => acc + item.expenseYER, 0);
        setDashMetrics({ incomeYER: income, expenseYER: expense, balanceYER: summary.balanceYER });
        setChartState({
          labels: period.map((item) => item.period),
          datasets: [
            {
              label: 'الدخل',
              data: period.map((item) => item.incomeYER),
              borderColor: '#0c8a8a',
              backgroundColor: 'rgba(12, 138, 138, 0.2)'
            },
            {
              label: 'المصروف',
              data: period.map((item) => item.expenseYER),
              borderColor: '#dc2626',
              backgroundColor: 'rgba(220, 38, 38, 0.2)'
            }
          ]
        });
      }
    } finally {
      setLoading(false);
    }
  }, [repositories, inventoryService, reportService]);

  useEffect(() => {
    if (repositories) {
      loadAllData();
    }
  }, [repositories, loadAllData]);

  useEffect(() => {
    if (!globalSearchQuery.trim()) {
      setGlobalSearchResults([]);
      return;
    }
    const normalized = globalSearchQuery.trim().toLowerCase();
    const results: SearchResult[] = [];
    for (const patient of patients) {
      const displayName = locale === 'ar' ? patient.fullNameAr : patient.fullNameEn ?? patient.fullNameAr;
      if (
        displayName.toLowerCase().includes(normalized) ||
        (patient.phone ?? '').includes(normalized) ||
        patient.code.toLowerCase().includes(normalized)
      ) {
        results.push({
          id: patient.id,
          label: displayName,
          detail: patient.phone ?? patient.code,
          section: 'patients'
        });
      }
    }
    for (const appointment of appointments) {
      const matches =
        appointment.patientName?.toLowerCase().includes(normalized) ||
        appointment.doctorName?.toLowerCase().includes(normalized);
      if (matches) {
        results.push({
          id: appointment.id,
          label: appointment.patientName ?? appointment.id,
          detail: new Date(appointment.start).toLocaleString(locale === 'ar' ? 'ar-YE' : 'en-US'),
          section: 'appointments'
        });
      }
    }
    for (const invoice of invoices) {
      const matches =
        invoice.patientName?.toLowerCase().includes(normalized) ||
        invoice.id.toLowerCase().includes(normalized);
      if (matches) {
        results.push({
          id: invoice.id,
          label: invoice.patientName ?? invoice.id,
          detail: formatYER(invoice.outstandingYER ?? 0, locale === 'ar' ? 'ar-YE' : 'en-US'),
          section: 'billing'
        });
      }
    }
    setGlobalSearchResults(results.slice(0, 10));
  }, [globalSearchQuery, patients, appointments, invoices, locale]);

  useEffect(() => {
    if (!globalSearchOpen) {
      setGlobalSearchQuery('');
      setGlobalSearchResults([]);
    }
  }, [globalSearchOpen]);

  useEffect(() => {
    const localeTag = locale === 'ar' ? 'ar-EG' : 'en-US';
    setAlerts(
      soonToExpire.map((entry) => ({
        id: entry.batchId,
        label: entry.itemName,
        details: `${locale === 'ar' ? 'تنتهي في' : 'Expires'} ${new Date(entry.expiryDate).toLocaleDateString(localeTag)}`,
        daysRemaining: entry.daysRemaining
      }))
    );
  }, [soonToExpire, locale]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === 'k') {
        event.preventDefault();
        setGlobalSearchOpen(true);
      }
      if ((event.ctrlKey || event.metaKey) && key === 's') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('myclinic:auto-save'));
      }
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        if (key === 'n') {
          setActiveSection('patients');
        }
        if (key === 'f') {
          setGlobalSearchOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleAddSampleAccountingData = useCallback(async () => {
    if (!cashboxService) {
      return;
    }
    await cashboxService.createReceipt({
      amountYER: 14000 + Math.floor(Math.random() * 3000),
      method: 'cash',
      createdBy: PLATFORM
    });
    await cashboxService.createPaymentVoucher({
      amountYER: 7500,
      payee: 'مصاريف صيانة',
      reason: 'عملية تجريبية',
      createdBy: PLATFORM
    });
    await loadAllData();
    alert('تمت إضافة حركة مالية تجريبية إلى النظام.');
  }, [cashboxService, loadAllData]);

  const handleSearchSelect = useCallback((result: SearchResult) => {
    setActiveSection(result.section);
    setGlobalSearchOpen(false);
  }, []);

  const dashboardProps: DashboardViewProps = { metrics: dashMetrics, chart: chartState, alerts };
  const patientsProps: PatientsViewProps = { patients, locale };
  const appointmentsProps: AppointmentsViewProps = { appointments, locale };
  const sessionsProps: SessionsViewProps = { sessions, locale };
  const billingProps: BillingViewProps = { invoices, locale };
  const inventoryProps: InventoryViewProps = {
    items: inventoryItems,
    batches: inventoryBatches,
    alerts: soonToExpire,
    locale
  };
  const labProps: LabOrdersViewProps = { labOrders, locale };
  const suppliersProps: SuppliersViewProps = { suppliers, locale };
  const accountingProps: AccountingViewProps = {
    ledger: ledgerEntries,
    receipts,
    payments: paymentVouchers,
    summary: cashSummary,
    locale
  };
  const reportsProps: ReportsViewProps = {
    period: reportPeriod,
    expenseByCategory: reportCategories,
    netByDoctor: reportDoctors,
    locale
  };
  const settingsProps: SettingsViewProps = { doctors, toothStatuses, locale };
  const auditProps: AuditLogViewProps = { logs: auditLogs, locale };

  const topbarContent = (
    <div className="mc-topbar-actions">
      <button type="button" onClick={() => setGlobalSearchOpen(true)}>
        بحث شامل
      </button>
      <button type="button" className="secondary" onClick={() => setLocale((prev) => (prev === 'ar' ? 'en' : 'ar'))}>
        {locale === 'ar' ? 'English' : 'العربية'}
      </button>
      <button type="button" className="secondary" onClick={handleAddSampleAccountingData} disabled={!cashboxService}>
        إضافة حركة تجريبية
      </button>
      <span>{formatYER(cashSummary.balanceYER, locale === 'ar' ? 'ar-YE' : 'en-US')}</span>
    </div>
  );

  return (
    <AppShell
      brand={<span>MyClinicDB</span>}
      sidebarItems={sections.map((section) => ({
        id: section.id,
        label: section.label,
        active: section.id === activeSection,
        onClick: () => setActiveSection(section.id)
      }))}
      collapsed={sidebarCollapsed}
      onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
      topbarContent={topbarContent}
      locale={locale}
    >
      <Suspense fallback={<EmptyState title="جاري التحميل" description="يتم تجهيز الواجهة" />}> 
        {activeSection === 'dashboard' && <DashboardView {...dashboardProps} />}
        {activeSection === 'patients' && <PatientsView {...patientsProps} />}
        {activeSection === 'appointments' && <AppointmentsView {...appointmentsProps} />}
        {activeSection === 'sessions' && <SessionsView {...sessionsProps} />}
        {activeSection === 'billing' && <BillingView {...billingProps} />}
        {activeSection === 'inventory' && <InventoryView {...inventoryProps} />}
        {activeSection === 'lab' && <LabOrdersView {...labProps} />}
        {activeSection === 'suppliers' && <SuppliersView {...suppliersProps} />}
        {activeSection === 'accounting' && <AccountingView {...accountingProps} />}
        {activeSection === 'reports' && <ReportsView {...reportsProps} />}
        {activeSection === 'settings' && <SettingsView {...settingsProps} />}
        {activeSection === 'audit' && <AuditLogView {...auditProps} />}
      </Suspense>

      {loading && (
        <EmptyState title="جاري التحميل" description="يجري تجهيز بيانات وضع عدم الاتصال" />
      )}

      {globalSearchOpen && (
        <div className="mc-global-search">
          <div className="mc-global-search__dialog" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <header>
              <h3>البحث السريع</h3>
              <button type="button" onClick={() => setGlobalSearchOpen(false)}>
                إغلاق
              </button>
            </header>
            <input
              type="search"
              placeholder={locale === 'ar' ? 'ابحث عن مريض أو فاتورة' : 'Search patient or invoice'}
              autoFocus
              value={globalSearchQuery}
              onChange={(event) => setGlobalSearchQuery(event.target.value)}
            />
            <div className="mc-global-search__results">
              {globalSearchResults.length === 0 ? (
                <p className="mc-text-muted">لا توجد نتائج مطابقة بعد.</p>
              ) : (
                globalSearchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className="mc-global-search__result"
                    onClick={() => handleSearchSelect(result)}
                  >
                    <span>{result.label}</span>
                    <small>{result.detail}</small>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

