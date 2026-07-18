/**
 * Analytics export helpers — CSV, Excel-compatible CSV, PDF (pdfkit).
 */
const PDFDocument = require('pdfkit');

const escapeCsv = (v) => {
  const s = v == null ? '' : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const rowsToCsv = (headers, rows) => {
  const lines = [headers.map(escapeCsv).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsv(row[h])).join(','));
  }
  return lines.join('\n');
};

/** Flatten admin BI dashboard into tabular sections for export */
const biDashboardToTables = (data) => {
  const sections = [];
  sections.push({
    name: 'summary',
    headers: ['metric', 'value'],
    rows: [
      { metric: 'days', value: data.days },
      { metric: 'revenue', value: data.revenue?.revenue },
      { metric: 'gmv', value: data.revenue?.gmv },
      { metric: 'orders', value: data.revenue?.orders },
      { metric: 'aov', value: data.aov },
      { metric: 'delivered', value: data.revenue?.delivered_orders },
      {
        metric: 'abandonment_rate',
        value: data.cart_abandonment?.abandonment_rate,
      },
      { metric: 'retention_30d', value: data.retention?.rate_30d },
    ],
  });
  if (data.revenue_daily?.length) {
    sections.push({
      name: 'daily_revenue',
      headers: ['day', 'orders', 'revenue'],
      rows: data.revenue_daily,
    });
  }
  if (data.popular_restaurants?.length) {
    sections.push({
      name: 'popular_restaurants',
      headers: ['name', 'orders', 'revenue', 'rating'],
      rows: data.popular_restaurants,
    });
  }
  if (data.popular_dishes?.length) {
    sections.push({
      name: 'popular_dishes',
      headers: ['name', 'restaurant_name', 'orders_count', 'revenue'],
      rows: data.popular_dishes,
    });
  }
  if (data.city_sales?.cities?.length) {
    sections.push({
      name: 'city_sales',
      headers: ['city', 'orders', 'revenue'],
      rows: data.city_sales.cities,
    });
  }
  if (data.coupon_performance?.coupons?.length) {
    sections.push({
      name: 'coupons',
      headers: ['code', 'redemptions', 'order_gmv'],
      rows: data.coupon_performance.coupons,
    });
  }
  return sections;
};

const exportBiCsv = (data) => {
  const sections = biDashboardToTables(data);
  return sections
    .map((s) => `# ${s.name}\n${rowsToCsv(s.headers, s.rows)}`)
    .join('\n\n');
};

/** Excel-friendly: UTF-8 BOM + CSV (opens in Excel) */
const exportBiExcelCsv = (data) => `\uFEFF${exportBiCsv(data)}`;

const exportBiPdf = (data) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text('Foodiq Analytics & BI Report', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#666')
        .text(`Period: last ${data.days} days · Generated ${data.generated_at || new Date().toISOString()}`);
      doc.moveDown();
      doc.fillColor('#000').fontSize(12);

      const s = data.revenue || {};
      doc.text(`Revenue: ₹${Number(s.revenue || 0).toFixed(2)}`);
      doc.text(`GMV: ₹${Number(s.gmv || 0).toFixed(2)}`);
      doc.text(`Orders: ${s.orders || 0} (delivered ${s.delivered_orders || 0})`);
      doc.text(`AOV: ₹${Number(data.aov || 0).toFixed(2)}`);
      doc.text(`Retention 30d: ${data.retention?.rate_30d ?? '—'}%`);
      doc.text(`Cart abandonment: ${data.cart_abandonment?.abandonment_rate ?? '—'}%`);
      doc.moveDown();

      doc.fontSize(14).text('AI Insights');
      doc.fontSize(10);
      for (const i of data.ai_insights?.insights || []) {
        doc.text(`• [${i.severity}] ${i.message}`);
      }
      doc.moveDown();

      doc.fontSize(14).text('Top Restaurants');
      doc.fontSize(10);
      for (const r of (data.popular_restaurants || []).slice(0, 8)) {
        doc.text(`${r.name}: ${r.orders} orders · ₹${Number(r.revenue || 0).toFixed(0)}`);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

module.exports = {
  rowsToCsv,
  exportBiCsv,
  exportBiExcelCsv,
  exportBiPdf,
  biDashboardToTables,
};
