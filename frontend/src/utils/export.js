// CSV / PDF export helpers used by the Reports module and list pages.
const cell = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
};

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** columns: [{ label, value: (row) => any }] */
export function exportCSV(filename, columns, rows, preamble = []) {
  const lines = [
    ...preamble.map((p) => cell(p)),
    columns.map((c) => cell(c.label)).join(','),
    ...rows.map((r) => columns.map((c) => cell(c.value(r))).join(',')),
  ];
  download(new Blob([`﻿${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' }), filename);
}

/** Generates a simple A4 PDF with a header, summary pairs and a table. */
export async function exportPDF({ filename, title, subtitle, summary = [], columns, rows, note }) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(28, 61, 118); doc.rect(0, 0, w, 64, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.text('E-GramSwaraj+ | South Thittankulam', 36, 28);
  doc.setFontSize(9); doc.text('Kovilpatti Taluk, Tamil Nadu - 628502', 36, 46);
  doc.setTextColor(20, 20, 20); doc.setFontSize(14); doc.text(title, 36, 92);
  doc.setFontSize(9); doc.setTextColor(90, 90, 90);
  doc.text(`${subtitle ? `${subtitle}  |  ` : ''}Generated ${new Date().toLocaleString('en-IN')}`, 36, 108);
  let y = 124;
  if (summary.length) {
    autoTable(doc, {
      startY: y, theme: 'grid', styles: { fontSize: 9 }, headStyles: { fillColor: [238, 243, 251], textColor: 20 },
      head: [summary.map((s) => s[0])], body: [summary.map((s) => String(s[1]))], margin: { left: 36, right: 36 },
    });
    y = doc.lastAutoTable.finalY + 16;
  }
  autoTable(doc, {
    startY: y, styles: { fontSize: 8, cellPadding: 4 }, headStyles: { fillColor: [28, 61, 118] },
    head: [columns.map((c) => c.label)], body: rows.map((r) => columns.map((c) => { const v = c.value(r); return v === null || v === undefined ? '' : String(v).replace(/₹/g, 'Rs.'); })),
    margin: { left: 36, right: 36 },
  });
  doc.setFontSize(8); doc.setTextColor(120, 120, 120);
  doc.text(note || 'Prototype report generated from demo data - not an official government record.', 36, doc.internal.pageSize.getHeight() - 20);
  doc.save(filename);
}
