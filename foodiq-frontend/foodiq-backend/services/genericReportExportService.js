/**
 * Shared tabular PDF/XLSX renderer for admin report exports.
 * Single source of truth for the Foodiq export visual language (previously
 * duplicated near-identically across orderExportPdfService.js and
 * restaurantExportService.js).
 */
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const MAX_ROWS = 500;

const formatCell = (value) => {
  if (value === null || value === undefined) return '-';
  if (value instanceof Date) return value.toLocaleString('en-IN');
  return String(value);
};

const buildExportPdf = async (rows, columns, { title, entityLabel = 'row' }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fillColor('#E23744').fontSize(20).font('Helvetica-Bold').text(`Foodiq — ${title}`, 40, 40);
    doc.fillColor('#6B7280').fontSize(9).font('Helvetica').text(
      `Generated ${new Date().toLocaleString('en-IN')} · ${rows.length} ${entityLabel}(s)`,
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
      doc.font('Helvetica-Oblique').fontSize(8).fillColor('#6B7280').text(
        `…and ${rows.length - MAX_ROWS} more ${entityLabel}(s) not shown — use CSV export for the full result set.`,
        40,
        y + 6
      );
    }

    doc.end();
  });
};

const buildExportXlsx = async (rows, columns, { sheetName = 'Report' } = {}) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Foodiq Admin';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((col) => ({ header: col.label, key: col.key, width: 22 }));
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE23744' } };

  rows.slice(0, MAX_ROWS).forEach((row) => {
    sheet.addRow(columns.reduce((acc, col) => ({ ...acc, [col.key]: formatCell(row[col.key]) }), {}));
  });

  return workbook.xlsx.writeBuffer();
};

module.exports = {
  formatCell,
  buildExportPdf,
  buildExportXlsx,
};
