import { describe, it, expect, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseRstGridTable as parseTs } from './rstTableParser';
import type { RstTableModel } from './rstTableParser';
import { buildTableAst as buildTs } from './rstTableAst';

/**
 * H1394 Lane 3 item 3.2 — drift guard for the rstTable* files, which live in
 * THREE hand-synced places with no shared package and, until now, no machine
 * check:
 *
 *   CANONICAL (TS, this repo) src/remark/{rstTable,rstTableAst,rstTableParser}.ts
 *   PORT (JS, hand-ported)    sanskrit-lexicon/csl-guides   src/remark/{...}.mjs
 *   PORT (JS, hand-ported)    gasyoun/SanskritGrammar        src/remark/{...}.mjs
 *
 * Two live checks below, both against raw.githubusercontent.com on each repo's
 * default branch (never a stale local clone, so this always tests what is
 * actually deployed):
 *
 *   (a) BYTE-IDENTITY — the two .mjs ports must match each other exactly for
 *       all 3 files. They are maintained as literal hand-synced copies of one
 *       another; any byte of divergence between them is drift by definition.
 *       (Confirmed byte-identical 21-07-2026 as the pre-check for this task —
 *       see repo memory note h1394-rsttable-drift-guard-check.)
 *   (b) PORT-PARITY — the csl-guides .mjs port, fetched live and imported
 *       directly, must produce output structurally equivalent to the TS
 *       canonical when run over this repo's own parser/AST-builder fixtures.
 *       TS source and .mjs source can never be byte-identical (different
 *       language) — this checks behavior, not text.
 *
 * Both live checks degrade to a WARN + vitest skip (never a false green, never
 * a hard local failure) if the network is unreachable — CI always has network,
 * so CI is where enforcement actually lives (.github/workflows/test.yml).
 *
 * The final describe block ("self-test") proves the comparison functions used
 * by both checks above actually have teeth: it feeds them a deliberately
 * mutated fixture derived from a REAL file/output and asserts a reported
 * MISMATCH, then feeds them the unmutated original and asserts a reported
 * MATCH. That block needs no network and always runs, in CI and locally.
 */

const FILES = [
  'rstTable.mjs',
  'rstTableAst.mjs',
  'rstTableParser.mjs',
] as const;

const PORT_SITES = {
  cslGuides:
    'https://raw.githubusercontent.com/sanskrit-lexicon/csl-guides/main/src/remark',
  sanskritGrammar:
    'https://raw.githubusercontent.com/gasyoun/SanskritGrammar/main/src/remark',
} as const;

// ---------------------------------------------------------------------------
// Pure comparison logic — exported so the self-test block can exercise the
// EXACT functions the live checks use above. That is what makes the self-test
// a real proof of teeth rather than a check-shaped placebo.
// ---------------------------------------------------------------------------

export interface ByteCompareResult {
  identical: boolean;
  /** Index of the first differing character; -1 when identical. */
  firstDiffIndex: number;
}

/** Part (a)'s comparison primitive: exact string/byte identity. */
export function compareByteIdentity(a: string, b: string): ByteCompareResult {
  if (a === b) return { identical: true, firstDiffIndex: -1 };
  const len = Math.min(a.length, b.length);
  let i = 0;
  while (i < len && a[i] === b[i]) i++;
  return { identical: false, firstDiffIndex: i };
}

export interface OutputCompareResult {
  equivalent: boolean;
  /** JSON-path-ish pointer to the first divergence; undefined when equivalent. */
  diffPath?: string;
}

/** Part (b)'s comparison primitive: structural (not referential) equivalence. */
export function compareTableOutputs(
  a: unknown,
  b: unknown,
): OutputCompareResult {
  const diffPath = firstDiffPath(a, b, '$');
  return diffPath === undefined
    ? { equivalent: true }
    : { equivalent: false, diffPath };
}

function firstDiffPath(a: unknown, b: unknown, at: string): string | undefined {
  if (a === b) return undefined;
  if (typeof a !== typeof b) return `${at} (type ${typeof a} vs ${typeof b})`;
  if (a === null || b === null || typeof a !== 'object') {
    return `${at} (${JSON.stringify(a)} vs ${JSON.stringify(b)})`;
  }
  const aKeys = Array.isArray(a)
    ? a.map((_, i) => String(i))
    : Object.keys(a as object);
  const bKeys = Array.isArray(b)
    ? b.map((_, i) => String(i))
    : Object.keys(b as object);
  if (aKeys.length !== bKeys.length) {
    return `${at} (${aKeys.length} keys vs ${bKeys.length} keys)`;
  }
  for (const key of aKeys) {
    const sub = firstDiffPath((a as any)[key], (b as any)[key], `${at}.${key}`);
    if (sub) return sub;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Network helpers
// ---------------------------------------------------------------------------

// GitHub raw-content fetches are normally sub-second, but CI/dev-sandbox
// network latency is variable — a per-request abort timeout turns a stalled
// connection into a catchable error (routed through skipOnNetworkFailure)
// instead of vitest's own test-level timeout killing the test uncatchably.
const FETCH_TIMEOUT_MS = 15_000;
// Generous per-test timeout: up to 3 sequential/parallel fetches plus a
// dynamic import, each individually capped at FETCH_TIMEOUT_MS above.
const LIVE_TEST_TIMEOUT_MS = 30_000;

async function fetchRaw(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
  return res.text();
}

/** Structural type for the parts of vitest's test-callback context this file
 * uses — `.skip()` lives on vitest's internal TaskContext, which isn't
 * re-exported under a stable public name, so a minimal structural type is
 * used instead of importing it. */
interface SkippableContext {
  skip: () => void;
}

/** Turns a network failure into a WARN + vitest skip instead of a hard local
 * failure, while still returning `null` so the caller stops early. CI always
 * has network, so CI is where these checks actually bite. */
function skipOnNetworkFailure(ctx: SkippableContext, what: string) {
  return (err: unknown): null => {
    console.warn(
      `[rstTable drift-guard] live fetch unavailable for ${what}, skipping ` +
        `(CI enforces this check): ${(err as Error).message}`,
    );
    ctx.skip();
    return null;
  };
}

// ---------------------------------------------------------------------------
// (a) byte-identity between the two live port sites
// ---------------------------------------------------------------------------

describe('rstTable drift-guard (a): csl-guides <-> SanskritGrammar .mjs ports are byte-identical', () => {
  for (const file of FILES) {
    it(
      file,
      async (ctx) => {
        const fetched = await Promise.all([
          fetchRaw(`${PORT_SITES.cslGuides}/${file}`),
          fetchRaw(`${PORT_SITES.sanskritGrammar}/${file}`),
        ]).catch(skipOnNetworkFailure(ctx, file));
        if (!fetched) return;
        const [cslGuides, sanskritGrammar] = fetched;
        const result = compareByteIdentity(cslGuides, sanskritGrammar);
        expect(
          result.identical,
          `csl-guides and SanskritGrammar copies of ${file} have drifted apart ` +
            `(first difference at character ${result.firstDiffIndex}). Re-sync by ` +
            `hand, diffing both raw URLs — see the /cologne-fork-sync-check pattern.`,
        ).toBe(true);
      },
      LIVE_TEST_TIMEOUT_MS,
    );
  }
});

// ---------------------------------------------------------------------------
// (b) TS canonical vs. live csl-guides .mjs port — output parity over the
//     canonical repo's own fixtures (mirrors rstTableParser.test.ts /
//     rstTableAst.test.ts; keep in sync by hand if those grow new fixtures).
// ---------------------------------------------------------------------------

interface LivePort {
  parseRstGridTable: (source: string) => RstTableModel;
  buildTableAst: (model: RstTableModel) => unknown;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Repo-local (not os.tmpdir()) so bare-specifier imports inside the fetched
// .mjs files (unist-util-visit, mdast-util-from-markdown, ...) resolve via
// THIS repo's own node_modules by walking up the directory tree. Lives under
// the repo's existing gitignored /tmp (see .gitignore), not a new ignore rule.
const TMP_PORT_DIR = path.resolve(__dirname, '../../tmp/drift-guard-port');

let livePortPromise: Promise<LivePort> | null = null;

/** Fetches the three live csl-guides .mjs files, writes them together under a
 * repo-local temp dir (so their relative sibling imports resolve too), and
 * dynamically imports the entry point. Cached so tests don't refetch. */
function getLivePort(): Promise<LivePort> {
  if (!livePortPromise) {
    livePortPromise = (async () => {
      fs.mkdirSync(TMP_PORT_DIR, { recursive: true });
      for (const file of FILES) {
        const content = await fetchRaw(`${PORT_SITES.cslGuides}/${file}`);
        fs.writeFileSync(path.join(TMP_PORT_DIR, file), content, 'utf8');
      }
      const parserMod: any = await import(
        pathToFileURL(path.join(TMP_PORT_DIR, 'rstTableParser.mjs')).href
      );
      const astMod: any = await import(
        pathToFileURL(path.join(TMP_PORT_DIR, 'rstTableAst.mjs')).href
      );
      return {
        parseRstGridTable: parserMod.parseRstGridTable,
        buildTableAst: astMod.buildTableAst,
      };
    })();
  }
  return livePortPromise;
}

afterAll(() => {
  fs.rmSync(TMP_PORT_DIR, { recursive: true, force: true });
});

// Same fixtures as rstTableParser.test.ts (kept in sync by hand — small and
// stable; add new ones here too if that file grows more).
const PARSER_FIXTURES: { name: string; src: string }[] = [
  {
    name: 'simple header + body',
    src: ['+---+---+', '| A | B |', '+===+===+', '| C | D |', '+---+---+'].join(
      '\n',
    ),
  },
  {
    name: 'no === line (all body)',
    src: ['+---+---+', '| A | B |', '+---+---+'].join('\n'),
  },
  {
    name: 'colspan (horizontal merge)',
    src: ['+---+---+', '| A     |', '+---+---+', '| B | C |', '+---+---+'].join(
      '\n',
    ),
  },
  {
    name: 'rowspan (vertical merge)',
    src: ['+---+---+', '| A | B |', '+   +---+', '|   | C |', '+---+---+'].join(
      '\n',
    ),
  },
  {
    name: 'lesson 9 jāyā paradigm',
    src: [
      '+------+-----------+---------------+----------------+',
      '|      | Ед.ч.     | Дв.ч.         | Мн.ч.          |',
      '+======+===========+===============+================+',
      '| N.   | jāyā      | jāye          | jāyāḥ (s)      |',
      '+------+-----------+               +                +',
      '| V.   | jāye      |               |                |',
      '+------+-----------+               +                +',
      '| Acc. | jāyā-m    |               |                |',
      '+------+-----------+---------------+----------------+',
      '| I.   | jāya-y-ā  | jāyā-bhyām    | jāyā-bhiḥ (s)  |',
      '+------+-----------+               +----------------+',
      '| D.   | jāyāyai   |               | jāyā-bhyaḥ (s) |',
      '+------+-----------+               +                +',
      '| Abl. | jāyā-y-āḥ |               |                |',
      '+------+           +---------------+----------------+',
      '| G.   |           | jāya-y-or (s) | jāyā-n-ām      |',
      '+------+-----------+               +----------------+',
      '| L.   | jāyā-y-ām |               | jāyā-su        |',
      '+------+-----------+---------------+----------------+',
    ].join('\n'),
  },
  {
    name: 'cell spanning both rows and columns',
    src: [
      '+---+---+---+',
      '| A     | B |',
      '+       +---+',
      '|       | C |',
      '+---+---+---+',
      '| D | E | F |',
      '+---+---+---+',
    ].join('\n'),
  },
];

describe('rstTable drift-guard (b): TS canonical vs. live csl-guides .mjs port — output parity', () => {
  it(
    'parseRstGridTable: identical output for every canonical fixture',
    async (ctx) => {
      const port = await getLivePort().catch(
        skipOnNetworkFailure(ctx, 'csl-guides port'),
      );
      if (!port) return;
      for (const { name, src } of PARSER_FIXTURES) {
        const tsResult = parseTs(src);
        const portResult = port.parseRstGridTable(src);
        const cmp = compareTableOutputs(tsResult, portResult);
        expect(
          cmp.equivalent,
          `fixture "${name}": TS canonical vs. .mjs port diverge at ${cmp.diffPath}`,
        ).toBe(true);
      }
    },
    LIVE_TEST_TIMEOUT_MS,
  );

  it(
    'parseRstGridTable: throws the same descriptive error on invalid input in both',
    async (ctx) => {
      const port = await getLivePort().catch(
        skipOnNetworkFailure(ctx, 'csl-guides port'),
      );
      if (!port) return;
      for (const bad of ['not a table at all', '+---+']) {
        expect(() => parseTs(bad)).toThrow(/not a valid RST grid table/);
        expect(() => port.parseRstGridTable(bad)).toThrow(
          /not a valid RST grid table/,
        );
      }
    },
    LIVE_TEST_TIMEOUT_MS,
  );

  it(
    'buildTableAst: identical structure for a representative model (spans, header, body)',
    async (ctx) => {
      const port = await getLivePort().catch(
        skipOnNetworkFailure(ctx, 'csl-guides port'),
      );
      if (!port) return;
      const model = parseTs(
        PARSER_FIXTURES.find((f) => f.name === 'lesson 9 jāyā paradigm')!.src,
      );
      const tsAst = buildTs(model);
      const portAst = port.buildTableAst(model);
      const cmp = compareTableOutputs(tsAst, portAst);
      expect(
        cmp.equivalent,
        `buildTableAst: TS canonical vs. .mjs port diverge at ${cmp.diffPath}`,
      ).toBe(true);
    },
    LIVE_TEST_TIMEOUT_MS,
  );
});

// ---------------------------------------------------------------------------
// Self-test — proves the comparison logic above has teeth (H1394 Lane 3 item
// 3.2's verification requirement). No network; always runs; exercises the
// SAME two functions (compareByteIdentity, compareTableOutputs) the live
// checks above use, against a deliberately mutated fixture derived from a
// real file / real parse output.
// ---------------------------------------------------------------------------

describe('rstTable drift-guard: self-test (proves the check has teeth)', () => {
  const realParserSrc = fs.readFileSync(
    path.join(__dirname, 'rstTableParser.ts'),
    'utf8',
  );

  it('compareByteIdentity: RED — reports a mismatch for a one-character-mutated real file', () => {
    // Flip exactly the final character of the real canonical source.
    const mutated = realParserSrc.slice(0, -1) + ' ';
    const result = compareByteIdentity(realParserSrc, mutated);
    expect(result.identical).toBe(false);
    expect(result.firstDiffIndex).toBe(realParserSrc.length - 1);
  });

  it('compareByteIdentity: RED — reports a mismatch for a real file with a harmless appended comment', () => {
    const mutated =
      realParserSrc + '\n// drift-guard self-test: harmless appended comment\n';
    const result = compareByteIdentity(realParserSrc, mutated);
    expect(result.identical).toBe(false);
    expect(result.firstDiffIndex).toBe(realParserSrc.length);
  });

  it('compareByteIdentity: GREEN — reports a match for the real file against an independent equal copy', () => {
    // Force a fresh string instance (not the same reference) so this proves
    // value equality, not accidental reference equality.
    const independentCopy = Buffer.from(realParserSrc, 'utf8').toString('utf8');
    const result = compareByteIdentity(realParserSrc, independentCopy);
    expect(result.identical).toBe(true);
    expect(result.firstDiffIndex).toBe(-1);
  });

  it('compareTableOutputs: RED — reports a mismatch when one cell of a real parse result is mutated', () => {
    const original = parseTs(PARSER_FIXTURES[0].src);
    const mutated: RstTableModel = JSON.parse(JSON.stringify(original));
    mutated.bodyRows[0][0].text = 'MUTATED';
    const cmp = compareTableOutputs(original, mutated);
    expect(cmp.equivalent).toBe(false);
    expect(cmp.diffPath).toContain('bodyRows');
  });

  it('compareTableOutputs: RED — reports a mismatch when a span attribute of a real parse result is mutated', () => {
    const original = parseTs(
      PARSER_FIXTURES.find((f) => f.name === 'rowspan (vertical merge)')!.src,
    );
    const mutated: RstTableModel = JSON.parse(JSON.stringify(original));
    const cellA = mutated.bodyRows.flat().find((c) => c.text === 'A')!;
    cellA.rowSpan = cellA.rowSpan + 1;
    const cmp = compareTableOutputs(original, mutated);
    expect(cmp.equivalent).toBe(false);
    expect(cmp.diffPath).toContain('rowSpan');
  });

  it('compareTableOutputs: GREEN — reports a match for two independent parses of the same real fixture', () => {
    const a = parseTs(PARSER_FIXTURES[0].src);
    const b = parseTs(PARSER_FIXTURES[0].src);
    const cmp = compareTableOutputs(a, b);
    expect(cmp.equivalent).toBe(true);
    expect(cmp.diffPath).toBeUndefined();
  });
});
