# سوبر برومت مشروع إدارة مركز أسنان

> انسخ الكتل بالترتيب عند الحاجة لتوليد الكود آليًا عبر Codex أو أي مولد كود آخر.

⸻

## الكتلة 1 — تعريف المشروع (Project Charter)

Role: أنت مُنشئ كود خبير يبني تطبيق إدارة مركز أسنان متكامل (عيادات متعددة) يعمل محليًا دون إنترنت، ويشتغل على:
- Windows: كتطبيق Electron (واجهة ويب + Node + SQLite).
- iPad: كتطبيق PWA يعمل داخل Safari (يدعم التثبيت كـ “Add to Home Screen”) مع نفس قاعدة الشفرة.

قيود إلزامية:
- العملة الوحيدة: الريال اليمني (YER). لا عملات أخرى، لا تحويلات، ولا تنسيق عملات غير YER.
- لا نظام ضريبي نهائيًا (لا VAT، لا ضريبة مصدر، لا تقارير ضريبية).
- الواجهة عربية RTL افتراضيًا، مع إمكانية تبديل للإنجليزية.
- محلي-أولًا (Offline-first): كل البيانات تُخزن محليًا (SQLite في Electron، IndexedDB + sql.js في PWA).
- نسخ احتياطي واستعادة (Export/Import JSON مشفر + ملف SQLite).
- صلاحيات دورية: Manager و Secretary (السكرتارية لديها صلاحيات محاسب: create_receipt، create_payment، void_receipt، void_payment).
- أداء ممتاز على أجهزة متوسطة.

وحدات أساسية مطلوبة:
1. لوحة التحكم Dashboard
2. المرضى Patients (بملف أسنان FDI تفاعلي)
3. المواعيد Appointments
4. الجلسات العلاجية Sessions (تسجِّل الإجراءات، المواد، الأتعاب)
5. الفواتير والإيصالات Billing (سند قبض/سند دفع) – بدون ضرائب
6. المعامل Lab Orders
7. المخزن/المواد Inventory (تواريخ صلاحية وتنبيهات قبل 6 أشهر)
8. المورّدون Suppliers
9. الحسابات/الخزنة Accounting (دفتر يومي، قيد بسيط، تقارير دخل/مصروف، رصيد الخزنة)
10. تقارير وطباعات PDF/Excel
11. الإعدادات Settings (الأطباء، نسب المشاركة، حالات الأسنان، قوائم منسدلة، نسخ احتياطي)
12. سجل تدقيق Audit Log (كل عملية مهمة تُسجَّل)

معمارية مقترحة:
- Frontend: TypeScript + Vite + Lit/Preact (خفيف)، أو React لو أردت وفرة مكونات.
- CSS: نظام تصميم Design Tokens مع CSS Variables وTailwind خيار إضافي.
- State: Zustand/Redux (خيار)، وService Layer مع Repository Pattern.
- DB Layer:
  - Electron: sqlite3/native + Prisma أو Drizzle ORM.
  - PWA: sql.js + Dexie لطبقة راقية، مع نفس واجهات Repository.
- Printing/PDF: jsPDF + autoTable، وتوليد Excel عبر SheetJS.
- i18n و RTL: i18next + logical properties CSS.
- أي تكامل سحابي اختياري مستقبلًا عبر مزامنة يدوية (Export/Import)، لكن الآن محلي فقط.

نبرة التصميم: بسيط، نظيف، احترافي، سريع التعلم. لا ازدحام بصري. كل شيء قابل باليد الواحدة على iPad.

⸻

## الكتلة 2 — تصميم الواجهات (UX/UI Design Brief)

مبادئ:
- شريط جانبي ثابت (Sidebar) بأيقونات واضحة كبيرة، عناوين عربية، وإظهار/إخفاء باللمس.
- تباين عالٍ، أحجام خط 14–16pt، لمسي-أولًا (Touch-first).
- لوح عمل واحد (Single Page): أقسام تتبدّل بلا إعادة تحميل.
- أشرطة أدوات علوية Contextual Toolbars لكل قسم.
- Panels قابلة للطي: “معلومات سريعة” و“إجراءات شائعة”.
- بحث عالمي (Global Search) بضغط Ctrl+K / ⌘+K.
- وضع مظلم تلقائي/يدوي.
- تنبيهات ذكية: صلاحية مواد، أقساط متأخرة، مواعيد اليوم.
- صيغ إدخال ذكية: Date Pickers، Numeric Pads، Auto-complete.
- مفاتيح اختصار لوحة المفاتيح على ويندوز، وإيماءات سحب على iPad.

شاشات رئيسية (اختصرها ثم بنها في الكود):
1. Dashboard
   - كروت: دخل اليوم/الأسبوع/الشهر (YER)، عدد المرضى اليوم، المواعيد القادمة، رصيد الخزنة.
   - مخططات: خطي للدخل، عمودي للمصروف، دائري لتوزيع بنود المصروف.
   - قائمة “تنبيهات اليوم”: مواد قاربت الانتهاء، مواعيد بلا تأكيد.
2. Patients
   - أعلى: نموذج إضافة/تعديل مريض (اسم، جوال، العمر/السن، الجنس، العنوان، محاذير طبية، طبيب مُعالِج).
   - أسفل: جدول تفاعلي (فرز/بحث/تصدير).
   - بطاقة مريض: تبويبات (Overview، Sessions، Billing، Lab، Files، Consents).
   - مخطط أسنان FDI تفاعلي (Tap على السن → حالات من الإعدادات).
3. Appointments
   - تقويم أسبوعي/يومي، سحب-وإفلات، ألوان حسب الطبيب/العيادة، تذكير SMS مستقبلاً (معلّق الآن).
4. Sessions
   - صفحة جلسة بمكونات سريعة: اختيار الأسنان، الإجراء، المواد المستخدمة، وقت البدء/الانتهاء، أتعاب، صور قبل/بعد.
   - زر “إنشاء فاتورة” مباشرة من الجلسة.
5. Billing
   - سند قبض/دفع بسيط، عملة YER فقط، لا ضرائب.
   - فاتورة علاجية تلقائية من الجلسات.
   - حالات: مسودة، مدفوعة جزئيًا، مدفوعة بالكامل، ملغاة (void).
   - قيد تلقائي للخزنة.
6. Inventory
   - مواد مع وحدات وBatch/Expiry.
   - تنبيه قبل 6 أشهر من انتهاء الصلاحية.
   - حركة المخزون (IN/OUT) مرتبطة بالجلسات والمشتريات.
7. Lab Orders
   - طلب معمل: نوع العمل، الصور/القوالب، المواعيد، التكلفة، حالة التسليم/الاستلام.
8. Accounting
   - دفتر يومي (دخل/مصروف) مرتبط بسندات القبض/الدفع والفواتير.
   - تقارير: دخل حسب الطبيب، صافي بعد خصم معامل ومواد، رصيد الخزنة، أرباح شهرية (بلا ضرائب).
   - لا أي حقول ضريبية.
9. Settings
   - الأطباء ونِسَبهم.
   - قائمة حالات الأسنان (قابلة للتخصيص وتظهر في مخطط FDI).
   - قوالب طباعة PDF (رأس/تذييل مع شعار العيادة).
   - نسخ احتياطي/استعادة.

هوية بصرية (Design Tokens):
- --brand-600، --surface، --text-strong، --radius-12، --gap-12…
- دعم الوضع الداكن بإصدارات لونية مكافئة.

⸻

## الكتلة 3 — نماذج البيانات (Domain Model)

صمم جداول وأسكيما موحّدة لكلا البيئتين (SQLite وsql.js):
- Doctor(id، name، phone، specialty، active، revenue_share%)
- Patient(id، code، full_name_ar، full_name_en، gender، dob، phone، address، notes_medical، doctor_id، created_at)
- ToothStatus(id، code، label_ar، label_en، color، is_default) ← تُضبط من الإعدادات
- PatientTooth(id، patient_id، tooth_number، status_id، notes)
- Appointment(id، patient_id، doctor_id، start، end، room، status، note)
- Session(id، patient_id، doctor_id، date، procedures_json، teeth_json، materials_json، duration_min، fee_yer، attachments)
- Invoice(id، patient_id، date، total_yer، paid_yer، status، linked_session_id، notes) ← بلا أي حقول ضريبية
- Receipt(id، invoice_id?، date، amount_yer، method، ref، created_by، voided)
- PaymentVoucher(id، date، amount_yer، payee، reason، created_by، voided) ← مصروفات
- Supplier(id، name، phone، address، active)
- InventoryItem(id، name، unit، sku، min_level، notes)
- InventoryBatch(id، item_id، batch_no، expiry_date، qty_in، qty_out، cost_yer، created_at)
- LabOrder(id، patient_id، doctor_id، type، sent_date، due_date، lab_name، cost_yer، status، notes)
- Ledger(id، date، type، ref_id، direction، amount_yer، note) ← دخل/مصروف لخزنة واحدة
- AuditLog(id، ts، user، action، entity، entity_id، delta_json)

ملاحظات:
- كل المبالغ *_yer أعداد صحيحة (بدون كسور) افتراضيًا.
- علاقات Foreign Keys واضحة.
- فهارس على (patient.name، phone)، (appointment.start)، (invoice.date)، (inventory.expiry_date).

⸻

## الكتلة 4 — سلوك النظام (Use Cases & Flows)

طبّق السيناريوهات التالية:
1. تسجيل مريض جديد → يظهر فورًا في جدول المرضى + كود تلقائي.
2. إضافة جلسة → اختيار الأسنان من مخطط FDI → إجراءات + مواد → حفظ → خيار “إنشاء فاتورة”.
3. إنشاء فاتورة من جلسة → مبلغ تلقائي من fee_yer → بدون أي ضرائب → حالة الفاتورة تتبع المدفوعات.
4. سند قبض → يُحدّث paid_yer للفاتورة + يُسجل في Ledger كدخل.
5. سند دفع (مصروف) → يُسجّل في Ledger كمصروف (مشتريات مواد/معامل/أخرى).
6. حركة مخزون تلقائية عند ربط مواد بجلسة (خصم كمية) أو استلام Batch جديد.
7. تنبيه صلاحية: قائمة مواد تنتهي خلال ≤ 6 أشهر على لوحة القيادة.
8. تقارير:
   - دخل يومي/شهري، دخل لكل طبيب، صافي بعد خصم المعمل والمواد (حساب بسيط).
   - رصيد الخزنة (مجاميع ledger الدخل – المصروف).
   - مواعيد اليوم، مرضى جدد هذا الأسبوع.
9. نسخ احتياطي/استعادة: تصدير JSON شامل + خيار تصدير ملف SQLite في ويندوز.
10. سجل تدقيق لكل العمليات CRUD الهامة.

⸻

## الكتلة 5 — واجهات برمجية داخلية (Service Layer)

أنشئ Services بواجهات ثابتة تعمل على Electron وPWA بنفس التواقيع:
- PatientService: CRUD، search، attachFiles، getToothMap، setToothStatus
- SessionService: create/update، linkMaterials، generateInvoice
- InvoiceService: createFromSession، getByPatient، applyReceipt، cancel
- CashboxService: createReceipt، voidReceipt، createPaymentVoucher، voidPayment
- InventoryService: addItem، addBatch، consume(item_id، qty)، soonToExpire()
- LabService: createOrder، updateStatus، listByPatient
- ReportService: incomeByPeriod، expenseByCategory، netByDoctor، cashBalance
- BackupService: exportJSON، importJSON، exportSQLite (Electron only)
- AuditService: log(action، entity، id، delta)

كل Service يحتوي اختبارات وحدات (Unit Tests) أساسية.

⸻

## الكتلة 6 — عناصر UI جاهزة (Components to Generate)

ولِّد مكونات قابلة لإعادة الاستخدام:
- AppShell (Sidebar + Topbar + Content) مع RTL.
- DataTable مع فرز/بحث/تصدير CSV/XLSX.
- ToothFDI مخطط أسنان تفاعلي يدعم تحديد مجموعة أسنان والسحب.
- MoneyInputYER حقل أرقام لا يقبل سوى YER (بدون رمز $ أو تنسيقات أجنبية).
- SmartForm: تخطيط شبكي + Validators عربية.
- KPIWidget كروت لوحة القيادة.
- ChartPanel (js-chart via Chart.js).
- PDFButton يولّد التقارير العربية (jsPDF + autoTable).
- ConfirmDialog، Toast، Tag، Badge، Stepper، EmptyState.

الطباعة/التقارير (Templates):
- سند قبض/دفع (عربي، رأس الشعار، حقول: الرقم، التاريخ، الجهة، المبلغ YER كتابةً ورقمًا، الغرض، التوقيع).
- فاتورة علاجية (عربي، تفاصيل المريض، الجلسات، الإجمالي YER، المدفوع، المتبقي).
- تقرير دخل شهري، حركة مخزون، أوامر معمل.
- كل القوالب بدون أي حقل ضريبي.

⸻

## الكتلة 7 — حوكمة البيانات والأمان

- حفظ تلقائي (debounced) للنماذج.
- تشفير اختياري لملف النسخ الاحتياطي (AES-256) بكلمة مرور.
- صلاحيات:
  - Manager: كل شيء.
  - Secretary: المرضى، المواعيد، الجلسات، الفواتير، السندات (قبض/دفع)، المخزون اليومي، تقارير أساسية، ولا يغير الإعدادات الحساسة.
- Audit Log لكل إنشاء/تعديل/حذف في كيانات المال والمخزون والجلسات والفواتير.

⸻

## الكتلة 8 — عدم وجود ضرائب + YER فقط (قيود تنفيذية)

طبّق قواعد تحقق (Guards) مركزية:
- رفض إنشاء حقول ضريبية (VAT، TAX، WHT…) أو نسب.
- أي محاولة لتغيير العملة → تُمنع ويُعرض تنبيه: “النظام يدعم الريال اليمني فقط.”
- جميع دوال الحسابات لا تستخدم غير *_yer كأعداد صحيحة (Integer)، مع تنسيق عربي (فواصل آلاف فقط).
- لا توليد لأي تقرير ضريبي.

⸻

## الكتلة 9 — الأداء وقابلية الاستخدام

- تحميل أول ≤ 2 ثانية على أجهزة متوسطة.
- Lazy Loading للوحدات الثقيلة.
- ضغط/تصغير مع Vite.
- تخزين صور الجلسات بكفاءة (WebP/AVIF) ومعاينات مصغرة.
- دعم اختصارات لوحة المفاتيح (مثل: N مريض جديد، F بحث، Ctrl+S حفظ).

⸻

## الكتلة 10 — نماذج بيانات أولية (Seed)

ولِّد Seed بسيط:
- 3 أطباء.
- 20 مريضًا عيّنة.
- 10 مواد مخزون + 2 دفعات (Batch) لكل مادة مع صلاحيات متباينة.
- 5 مواعيد اليوم.
- 8 جلسات، 5 فواتير (منها 2 مدفوعة جزئيًا)، 6 سندات قبض، 3 سندات دفع.
- طلبا معمل قيد التنفيذ.

⸻

## الكتلة 11 — الاختبارات (E2E + Unit)

- Unit: Services الأساسية (Patients، Sessions، Billing، Inventory).
- E2E: تدفق “جلسة → فاتورة → سند قبض”، والتنبيه بصلاحية المخزون.
- لقسم الطباعة، اختبار توليد PDF غير فارغ ويحتوي العناوين العربية.

⸻

## الكتلة 12 — مخرجات مطلوبة من Codex

1. هيكل مشروع كامل (Monorepo إن لزم) فيه:
   - apps/desktop-electron/
   - apps/pwa/
   - packages/ui/ (المكونات المشتركة)
   - packages/core/ (Services + Models + Repositories)
2. سكربتات npm للتشغيل والبناء والتعبئة (Electron Builder).
3. تعليمات تشغيل مختصرة عربي/إنجليزي (README).
4. توليد صفحات جاهزة بكل الشاشات الموصوفة، مع بيانات Seed، تعمل فورًا.

تذكير أخير:
- YER فقط.
- لا ضرائب.
- عربي RTL افتراضي.
- محلي-أولًا مع نسخ احتياطي/استعادة.

⸻
