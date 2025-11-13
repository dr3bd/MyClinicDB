import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ReactNode } from 'react';
import './styles.css';

export interface PDFButtonProps {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  fileName?: string;
  children?: ReactNode;
}

export function PDFButton({ title, headers, rows, fileName = 'report.pdf', children }: PDFButtonProps) {
  const generate = () => {
    const doc = new jsPDF({ orientation: 'portrait' });
    doc.setFont('helvetica', 'bold');
    doc.text(title, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    autoTable(doc, {
      head: [headers],
      body: rows,
      styles: {
        halign: 'right',
        font: 'helvetica'
      }
    });
    doc.save(fileName);
  };

  return (
    <button type="button" className="mc-button" onClick={generate}>
      {children ?? 'PDF'}
    </button>
  );
}
