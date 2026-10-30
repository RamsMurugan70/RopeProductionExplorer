// First-time load: publishes the three workbooks from the folder above this project, so the
// reports start with current figures. It will not replace published figures unless given --force.
const path = require('path');
const { ropeSet, extruderSet, salesSet } = require('./page-parsers');
const { makeStorage } = require('../server/storage');

const FOLDER = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.resolve(process.env.PPC_DATA_DIR || path.join(__dirname, '..', 'data'));
const force = process.argv.includes('--force');

const SETS = [
  ['rope', 'Daily wise production report-  2026.xlsx', ropeSet],
  ['extruder', 'Daily Exrusion Production Reports-2026.xlsx', extruderSet],
  ['sales', 'POLYMER SALES 2026-2027.xlsx', salesSet]
];

(async () => {
  const storage = makeStorage(DATA_DIR);
  for (const [set, file, read] of SETS) {
    const cur = await storage.getSet(set);
    if (cur && !force) { console.log(`${set}: already published (version ${cur.rev}), left as it is.`); continue; }
    const { data, warnings } = read(path.join(FOLDER, file));
    await storage.putSet(set, { rev: (cur ? cur.rev : 0) + 1, publishedAt: new Date().toISOString(), source: file, data });
    console.log(`${set}: published from ${file}.`);
    warnings.forEach(w => console.log('  note: ' + w));
  }
})().catch(e => { console.error(e.message); process.exit(1); });
