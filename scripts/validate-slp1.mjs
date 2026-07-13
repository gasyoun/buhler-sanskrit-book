#!/usr/bin/env node
// Validate SLP1 text in docs/*.mdx: flag IAST leftovers that render as
// wrong Devanagari. Checks <Sanscript text="..."> attributes and the SLP1
// part (before '=') of __S_...__ / __GTS_...__ shorthands.
//
// Flags:
//  - IAST aspirate digraphs (bh, gh, dh, kh, ph, th, ch, jh — any case):
//    in SLP1 aspirates are single letters (B G D K P T C J)
//  - IAST diphthongs ai/au: in SLP1 these are E/O, and Sanskrit forbids
//    vowel hiatus, so a word-internal "ai"/"au" is always a leftover
//  - IAST diacritic characters (ā ī ū ṛ ṝ ḷ ḹ ṃ ḥ ṅ ñ ṇ ś ṣ)
import fs from 'node:fs';
import path from 'node:path';

const DOCS_DIR = path.join(import.meta.dirname, '..', 'docs');

const IAST_DIGRAPH = /[kgcjwqtdpbKGCJWQTDPB]h/g;
const IAST_DIPHTHONG = /a[iu]/g;
const IAST_DIACRITIC = /[āīūṛṝḷḹṃḥṅñṇśṣĀĪŪṚṜḶḸṀḤṄÑṆŚṢ]/g;

const SANSCRIPT_TEXT = /<Sanscript[^>]*\stext="([^"]*)"/g;
const SHORTHAND = /__(?:S|GTS)_(.+?)__/g;

function findIssues(slp1, source) {
  const issues = [];
  for (const re of [IAST_DIGRAPH, IAST_DIPHTHONG, IAST_DIACRITIC]) {
    re.lastIndex = 0;
    for (const m of slp1.matchAll(re)) {
      issues.push({ match: m[0], source });
    }
  }
  return issues;
}

let total = 0;
const files = fs
  .readdirSync(DOCS_DIR)
  .filter((f) => f.endsWith('.mdx'))
  .sort();

for (const file of files) {
  const lines = fs
    .readFileSync(path.join(DOCS_DIR, file), 'utf8')
    .split('\n');
  lines.forEach((line, i) => {
    const issues = [];
    for (const m of line.matchAll(SANSCRIPT_TEXT)) {
      issues.push(...findIssues(m[1], `<Sanscript text="${m[1]}">`));
    }
    for (const m of line.matchAll(SHORTHAND)) {
      const slp1 = m[1].split('=')[0];
      issues.push(...findIssues(slp1, m[0]));
    }
    for (const { match, source } of issues) {
      console.log(`${file}:${i + 1} — "${match}" in ${source}`);
      total += 1;
    }
  });
}

if (total > 0) {
  console.error(`\n${total} SLP1 issue(s) found.`);
  process.exit(1);
}
console.log('SLP1 validation passed: no IAST leftovers found.');
