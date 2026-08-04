/**
 * Restaurant-list export (Admin Restaurant Management "Export" action).
 * Thin wrapper over genericReportExportService — see that module for the
 * shared Foodiq export visual language (PDF + XLSX).
 */
const { buildExportPdf, buildExportXlsx } = require('./genericReportExportService');

const buildRestaurantsExportPdf = (rows, columns) =>
  buildExportPdf(rows, columns, { title: 'Restaurants Export', entityLabel: 'restaurant' });

const buildRestaurantsExportXlsx = (rows, columns) =>
  buildExportXlsx(rows, columns, { sheetName: 'Restaurants' });

module.exports = {
  buildRestaurantsExportPdf,
  buildRestaurantsExportXlsx,
};
