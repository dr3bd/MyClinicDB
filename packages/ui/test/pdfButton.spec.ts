import { describe, it, expect } from 'vitest';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

describe('Arabic PDF generation', () => {
  it('produces a non-empty receipt PDF with Arabic heading', () => {
    const doc = new jsPDF({ orientation: 'portrait' });
    doc.setFont('helvetica', 'bold');
    const centerX = doc.internal.pageSize.getWidth() / 2;
    doc.text('سند قبض', centerX, 20, { align: 'center' });

    const autoTableFn = (autoTable as unknown as { default?: typeof autoTable }).default ?? (autoTable as unknown as typeof autoTable);
    autoTableFn(doc, {
      head: [['الرقم', 'التاريخ', 'المبلغ (YER)']],
      body: [['001', '2024-01-01', '15000']],
      styles: { halign: 'right' }
    });

    const firstPage = doc.internal.pages[1]?.join('') ?? '';
    const headingMatch = firstPage.match(/\((.*?)\) Tj/);
    expect(headingMatch).toBeTruthy();
    if (headingMatch) {
      const bytes = Uint8Array.from(Array.from(headingMatch[1]).map((ch) => ch.charCodeAt(0) & 0xff));
      const decoded = new TextDecoder('utf-16be').decode(bytes);
      expect(decoded).toMatch(/ﺪﻨﺳ|ﺴﻧد/);
    }

    const buffer = doc.output('arraybuffer') as ArrayBuffer;
    expect(buffer.byteLength).toBeGreaterThan(512);
  });
});
