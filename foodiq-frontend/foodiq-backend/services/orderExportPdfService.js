/**
 * Order-list export PDF (Admin Order Management "Export" action).
 * Mirrors the visual language of invoiceService.js — header, table, footer.
 */
const PDFDocument = require('pdfkit');

const MAX_ROWS = 500;

const formatCell = (value) => {
  if (value === null || value === undefined) return '-';
  if (value instanceof Date) return value.toLocaleString('en-IN');
  return String(value);
};

const buildOrdersExportPdf = async (rows, columns) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fillColor('#E23744').fontSize(20).font('Helvetica-Bold').text('Foodiq — Orders Export', 40, 40);
    doc.fillColor('#6B7280').fontSize(9).font('Helvetica').text(
      `Generated ${new Date().toLocaleString('en-IN')} · ${rows.length} order(s)`,
      40,
      64
    );
    doc.moveTo(40, 84).strokeColor('#E23744').lineWidth(2).lineTo(802, 84).stroke();

    const pageRows = rows.slice(0, MAX_ROWS);
    const colWidth = 762 / columns.length;
    let y = 100;

    const drawHeader = () => {
      doc.rect(40, y, 762, 20).fill('#F8FAFC');
      doc.fillColor('#6B7280').fontSize(8).font('Helvetica-Bold');
      columns.forEach((col, i) => {
        doc.text(col.label, 46 + i * colWidth, y + 6, { width: colWidth - 6 });
      });
      y += 24;
    };

    drawHeader();
    doc.font('Helvetica').fontSize(8).fillColor('#111827');

    pageRows.forEach((row) => {
      if (y > 550) {
        doc.addPage({ margin: 40, size: 'A4', layout: 'landscape' });
        y = 40;
        drawHeader();
        doc.font('Helvetica').fontSize(8).fillColor('#111827');
      }
      columns.forEach((col, i) => {
        doc.text(formatCell(row[col.key]), 46 + i * colWidth, y, { width: colWidth - 6 });
      });
      y += 18;
    });

    if (rows.length > MAX_ROWS) {
      doc.fillColor('#9CA3AF').fontSize(9).text(
        `And ${rows.length - MAX_ROWS} more — use CSV export for the full result set.`,
        40,
        y + 10
      );
    }

    doc.end();
  });
};

module.exports = { buildOrdersExportPdf };
