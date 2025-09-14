#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return []; }
}

const dataDir = path.join(process.cwd(), 'config', 'data');
const sources = readJson(path.join(dataDir, 'sources.json'));
const terms = readJson(path.join(dataDir, 'terms.json'));
const rules = readJson(path.join(dataDir, 'rules.json'));
const queries = readJson(path.join(dataDir, 'queries.json'));

const sourceIds = new Set(sources.map(s => s.id));
const termIds = new Set(terms.map(t => t.id));

let ok = true;

rules.forEach(r => {
  if (!sourceIds.has(r.sourceId)) {
    console.error(`Rule ${r.id} references missing sourceId: ${r.sourceId}`);
    ok = false;
  }
  if (!termIds.has(r.termId)) {
    console.error(`Rule ${r.id} references missing termId: ${r.termId}`);
    ok = false;
  }
});

queries.forEach(q => {
  (q.termIds || []).forEach(tid => {
    if (!termIds.has(tid)) {
      console.error(`Query ${q.id || q.name} references missing termId: ${tid}`);
      ok = false;
    }
  });
});

console.log(ok ? 'OK: config integrity checks passed' : 'FAIL: config integrity violations found');
process.exit(ok ? 0 : 1);

