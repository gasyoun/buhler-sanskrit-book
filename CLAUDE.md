# CLAUDE.md

_Created: 28-02-2026 · Last updated: 16-08-2026_

`buhler-sanskrit-book` is a **Docusaurus 3** static site for Bühler's
Sanskrit grammar — 20 lessons in Russian with Sanskrit examples — deployed
to GitHub Pages at
[gasyoun.github.io/buhler-sanskrit-book](https://gasyoun.github.io/buhler-sanskrit-book/).

Org conventions live in [`../CLAUDE.md`](https://github.com/gasyoun/github-spine/blob/main/CLAUDE.md).
Before encodings or corpus data, read the
[Sanskrit context primer](https://github.com/gasyoun/github-spine/blob/main/SANSKRIT_CONTEXT_PRIMER.md).

## How to run

```sh
npm start           # dev server, hot reload
npm run build       # production → /build
npm run typecheck   # TypeScript
npm run serve       # serve the production build
npm run deploy      # gh-pages
```

Lessons are MDX under `docs/` (`lesson1.mdx`–`lesson20.mdx`) with
`sidebar_position`; the sidebar is filesystem-generated. Vocabulary is four
TSVs in [`src/dictionary/`](https://github.com/gasyoun/buhler-sanskrit-book/tree/main/src/dictionary)
(`verb.tsv`, `noun.tsv`, `adjective.tsv`, `other.tsv`) parsed at runtime
with PapaParse.

Custom components in
[`src/components/`](https://github.com/gasyoun/buhler-sanskrit-book/tree/main/src/components):
`Dictionary.tsx` (filter TSV by `name` / `lesson` / `tag`, `format` with
`$field` placeholders), `Sanscript.tsx` (default SLP1 → Devanagari via
`@indic-transliteration/sanscript`), `Latin.tsx`. Remark plugin
[`src/remark/grammaticalTermShorthand.ts`](https://github.com/gasyoun/buhler-sanskrit-book/blob/main/src/remark/grammaticalTermShorthand.ts)
turns `GT_term` / `__GT_term__` into styled spans.

The TypeScript remark helpers under
[`src/remark/`](https://github.com/gasyoun/buhler-sanskrit-book/tree/main/src/remark)
are the **canonical** `rstTable*` copy; SanskritGrammar and csl-guides
carry hand-synced `.mjs` ports — keep all three in sync by hand.

TSV webpack import is wired in `docusaurus.config.ts`; types:
`src/types/tsv.d.ts`.

## Do not touch

- `build/`, `node_modules/` — generated/local.
- Do not hand-edit generated Docusaurus cache.
- Do not fork a second dictionary parser — `Dictionary.tsx` + the four TSVs
  are the vocabulary path.
- `sanskrit-util iast_to_devanagari` is broken; this site uses Sanscript
  for display conversion.

Danger facts:
[Uprava DANGER_FACTS.md](https://github.com/gasyoun/Uprava/blob/main/DANGER_FACTS.md)
and the generated block of
[AGENTS.md](https://github.com/gasyoun/buhler-sanskrit-book/blob/main/AGENTS.md).

_Dr. Mārcis Gasūns_
