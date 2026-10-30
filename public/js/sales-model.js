// One sales data set, two views of it. The Dashboard works with whole invoices; the
// Explorer works with flat lines: [invoiceNo, date, customer, segment, description, resin, coils, qty, value].
(function (root) {
  const r3 = n => Math.round(n * 1000) / 1000;

  function invoiceToLines(inv) {
    return (inv.items || []).filter(it => it.qty !== null && it.qty !== undefined).map(it => [
      inv.no, inv.date, String(inv.customer || '').replace(/\s*\n\s*/g, ', ').trim(),
      inv.segment === 'export' ? 'export' : 'domestic', String(it.desc || '').trim(), String(it.resin || '').trim(),
      Number(it.rolls) || 0, r3(Number(it.qty)), r3(Number(it.total) || 0)
    ]);
  }

  function storeToLines(store) {
    return Object.keys(store.invoices || {}).reduce((out, k) => out.concat(invoiceToLines(store.invoices[k])), []);
  }

  const sameLines = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // Rebuilds the store from Explorer lines. Invoices whose lines did not change keep all their
  // Dashboard detail (price, VAT, line items); changed ones are rebuilt from what the lines hold.
  function linesToStore(lines, prev) {
    const prevInv = (prev && prev.invoices) || {}, prevLi = (prev && prev.lineItems) || {};
    const prevByNo = {};
    Object.keys(prevInv).forEach(k => { prevByNo[prevInv[k].no] = { key: k, inv: prevInv[k] }; });

    const groups = new Map();
    lines.forEach(l => { if (!groups.has(l[0])) groups.set(l[0], []); groups.get(l[0]).push(l); });

    const invoices = {}, lineItems = {}, kept = new Set();
    groups.forEach((ls, no) => {
      const was = prevByNo[no];
      if (was && sameLines(invoiceToLines(was.inv).slice().sort(), ls.slice().sort())) {
        invoices[was.key] = was.inv; kept.add(no); return;
      }
      const first = ls[0];
      invoices[no] = {
        no, date: first[1], customer: first[2], segment: first[3], source: 'explorer', roundOff: null,
        rolls: ls.reduce((s, l) => s + l[6], 0), qty: r3(ls.reduce((s, l) => s + l[7], 0)), total: r3(ls.reduce((s, l) => s + l[8], 0)),
        items: ls.map(l => ({ desc: l[4], resin: l[5], rolls: l[6], qty: l[7], price: null, vat: null, taxable: null, total: l[8] }))
      };
      ls.forEach((l, i) => {
        const id = 'ex_' + String(no).replace(/[^A-Za-z0-9_.-]/g, '_') + '_' + i;
        lineItems[id] = { id, invoiceNo: no, date: l[1], segment: l[3] === 'export' ? 'EXPORT' : 'DOMESTIC', resin: l[5], customerId: '', customerName: l[2], description: l[4],
          coils: l[6], qty: l[7], unit: 'KGS', unitPrice: '', taxable: '', taxRate: '', taxDue: '', gross: l[8], invoiceValue: l[8], receipt: '', deposited: '', roundOff: '0' };
      });
    });
    Object.keys(prevLi).forEach(id => { if (kept.has(prevLi[id].invoiceNo)) lineItems[id] = prevLi[id]; });
    return { invoices, lineItems };
  }

  const api = { invoiceToLines, storeToLines, linesToStore };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PPCSales = api;
})(typeof window !== 'undefined' ? window : globalThis);
