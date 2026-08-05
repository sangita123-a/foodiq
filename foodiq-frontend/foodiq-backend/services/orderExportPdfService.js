/**
 * Order-list export PDF (Admin Order Management "Export" action).
 * Thin wrapper over genericReportExportService — see that module for the
 * shared Foodiq export visual language (header, table, footer).
 */
const { buildExportPdf } = require('./genericReportExportService');

const buildOrdersExportPdf = (rows, columns) =>
  buildExportPdf(rows, columns, { title: 'Orders Export', entityLabel: 'order' });

module.exports = { buildOrdersExportPdf };
