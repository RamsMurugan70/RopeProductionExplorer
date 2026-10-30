// Lifts the Excel-reading code straight out of the two pages, so the seed tool and the tests
// run exactly what the browser runs rather than a second copy of it.
const fs = require('fs'), path = require('path');
const XLSX = require('../public/vendor/xlsx.full.min.js');

global.XLSX = XLSX;
global.window = global;

const PUBLIC = path.join(__dirname, '..', 'public');

function between(text, from, to) {
  const a = text.indexOf(from);
  if (a < 0) throw new Error('Marker not found in page: ' + from);
  const b = text.indexOf(to, a);
  if (b < 0) throw new Error('Marker not found in page: ' + to);
  return text.slice(a, b);
}

const E = fs.readFileSync(path.join(PUBLIC, 'explorer.html'), 'utf8');
const explorer = new Function(
  between(E, 'const MONTH_KEYS=', 'const LINES=') + between(E, 'const mkey=', 'const rateOk=') + between(E, "const OTHER=", 'function sprep(') +
  'return {parseRopeWorkbook,parseExtWorkbook,parseSalesWorkbook};')();

const D = fs.readFileSync(path.join(PUBLIC, 'dashboard.html'), 'utf8');
const dashboard = new Function(
  between(D, 'function cleanName(', 'function normalizeCustomers(') + between(D, 'var XL_ALIASES', 'var XL_TEMPLATE_HEADERS') +
  between(D, 'function xlNorm(', 'var xlState') + 'function xlSafeId(no) { return String(no).trim().replace(/[^A-Za-z0-9_\\-.~:@+]/g, "_").slice(0, 150) || "inv"; }\n' +
  'return {parseRegisterRows,xlR3,xlSafeId};')();

function readWorkbook(file) {
  const wb = XLSX.read(fs.readFileSync(file), { type: 'buffer' });
  return wb.SheetNames.map(n => ({ name: n, aoa: XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: null }) }));
}

const LINES = ['R1', 'R2', 'R3', 'R4', 'R5'];

function ropeSet(file) {
  const o = explorer.parseRopeWorkbook(readWorkbook(file));
  return { data: { rows: o.rows.filter(r => LINES.includes(r[1])), shifts: o.shifts, mshifts: o.mshifts, reports: o.reports }, warnings: o.warnings };
}

function extruderSet(file) {
  const o = explorer.parseExtWorkbook(readWorkbook(file));
  return { data: o.recs, warnings: o.warnings };
}

// The same invoice and line-item records the Dashboard's "Upload Excel" saves.
function salesSet(file) {
  const sheet = readWorkbook(file)[0];
  const r = dashboard.parseRegisterRows(sheet.aoa);
  if (r.error) throw new Error(r.error);
  const invoices = {}, lineItems = {}, now = new Date().toISOString();
  r.invoices.filter(inv => !inv.error).forEach(inv => {
    const id = dashboard.xlSafeId(inv.no);
    invoices[id] = { no: inv.no, date: inv.date, customer: inv.customer, segment: inv.segment, items: inv.items, roundOff: inv.roundOff, rolls: inv.rolls, qty: inv.qty, total: inv.total, source: 'excel', addedAt: now };
    inv.items.forEach((it, idx) => {
      const meta = inv._lines[idx] || {};
      const rate = meta.rate != null ? meta.rate : (it.taxable ? Math.round((it.vat || 0) / it.taxable * 100) / 100 : 0.05);
      const ro = idx === 0 ? (inv.roundOff || 0) : 0;
      const row = { id: 'xl_' + id + '_' + idx, invoiceNo: inv.no, date: inv.date, segment: inv.segment === 'export' ? 'EXPORT' : 'DOMESTIC',
        resin: meta.resin || '', customerId: meta.customerId || '', customerName: inv.customer, description: it.desc,
        coils: it.rolls != null ? it.rolls : '', qty: it.qty != null ? it.qty : '', unit: meta.unit || 'KGS', unitPrice: it.price != null ? it.price : '',
        taxable: it.taxable != null ? it.taxable : '', taxRate: String(rate), taxDue: it.vat != null ? it.vat : 0, gross: it.total,
        invoiceValue: dashboard.xlR3((Number(it.total) || 0) + ro), receipt: meta.receipt != null ? meta.receipt : '', deposited: meta.deposited || '', roundOff: String(ro) };
      lineItems[row.id] = row;
    });
  });
  return { data: { invoices, lineItems }, warnings: r.invoices.filter(i => i.error).map(i => i.no + ': ' + i.error) };
}

module.exports = { explorer, dashboard, readWorkbook, ropeSet, extruderSet, salesSet };
