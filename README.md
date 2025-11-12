# MyClinicDB

**نظام إدارة مركز الأسنان محلي-أولًا (Offline-first)**

هذا المستودع يوفر هيكل مشروع متعدد التطبيقات:

- `apps/pwa`: تطبيق ويب تقدمي يعمل على iPad وSafari مع تجربة RTL افتراضية.
- `apps/desktop-electron`: تطبيق سطح مكتب مبني على Electron لنظام Windows.
- `packages/core`: طبقة النطاق (Domain) والخدمات والمستودعات وقاعدة البيانات الذاكرية والنسخ الاحتياطي.
- `packages/ui`: مكتبة مكوّنات React/RTL قابلة لإعادة الاستخدام.

The repository ships with complete TypeScript sources, seed data, unit tests, and Vite-based tooling to help you build and package the dental center management experience.

## المتطلبات (Requirements)

- Node.js 18 أو أحدث.
- npm 8+ (أو يمكنك استخدام pnpm/yarn مع دعم workspaces).

## التثبيت (Install)

```bash
npm install
```

## التشغيل أثناء التطوير (Development)

### PWA
```bash
npm run start:pwa
```
سيتم تشغيل Vite على المنفذ الافتراضي، ويمكن فتح `http://localhost:5173` باللغة العربية وبالبيانات التجريبية.

### Desktop (Electron)
```bash
npm run start:desktop
```
هذا الأمر يقوم بتشغيل Vite للواجهة الأمامية مع مراقبة Electron لتحديث النافذة تلقائيًا.

## البناء والتعبئة (Build & Package)

```bash
npm run build       # يبني جميع الحزم
npm run package:desktop  # يبني تطبيق Electron باستخدام electron-builder
```

## الاختبارات (Tests)

يحتوي `packages/core` على اختبارات Vitest للتحقق من خدمات المرضى والجلسات والفوترة والمخزون والنسخ الاحتياطي:

```bash
npm run test --workspace packages/core
```

## الميزات الرئيسية (Highlights)

- **العملة الوحيدة YER**: جميع الخدمات تفرض التكامل على الريال اليمني بدون كسور.
- **لا ضرائب**: طبقة الحسابات والفوترة خالية تمامًا من الحقول الضريبية.
- **خدمات مشتركة**: PatientService، SessionService، InventoryService، Invoice/Cashbox، Lab، Report، Backup مع تشفير AES-256 لملفات JSON وتصدير SQLite (sql.js).
- **مكتبة UI عربية**: AppShell، DataTable، ToothFDI، SmartForm، مكونات PDF، Toast/Tag/Badge، وغيرها تدعم RTL والوضع الليلي عبر CSS Variables.
- **Seed Data**: بيانات أولية تشمل 3 أطباء، 20 مريضًا، جلسات، سندات قبض ودفع، مواد مخزون، وأوامر معمل.
- **تطبيقات جاهزة**: PWA وElectron يتشاركان نفس الخدمات والمكوّنات ويعرضان لوحة تحكم، قائمة مرضى، مواعيد، وفوترة.

## النسخ الاحتياطي والاستعادة (Backup & Restore)

استخدم `BackupService` من `@myclinicdb/core` لتوليد ملفات JSON مشفرة أو ملفات SQLite تحتوي على جميع الجداول:

```ts
import { InMemoryRepositoryBundle, BackupService } from '@myclinicdb/core';

const repositories = new InMemoryRepositoryBundle();
const backup = new BackupService(repositories);
const envelope = await backup.exportJSON('strong-password');
const sqlite = await backup.exportSQLite();
```

## تراخيص وأذونات (Licensing)

الكود متاح بموجب رخصة MIT ويمكن إعادة استخدامه وتعديله داخليًا لتشغيل العيادات دون اتصال.
