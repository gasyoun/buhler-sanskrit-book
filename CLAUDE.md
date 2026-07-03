# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

Local clone/fork (`origin` = `gasyoun/buhler-sanskrit-book`, `upstream` =
`alexander-myltsev/buhler-sanskrit-book`) of a Docusaurus site publishing
digitized exercises from G. Bühler's *Руководство к элементарному курсу
санскритского языка* (Stockholm, 1923), electronic edition by N. P.
Likhushina (2008). 20 of 48 lessons digitized so far (`docs/lesson1.mdx` …
`docs/lesson20.mdx`); each lesson has translation-from-Sanskrit and
translation-to-Sanskrit exercises, shown in Devanāgarī + IAST with tagged
grammatical terms and full-text search. Work here is contributed back to the
upstream repo via PRs (see H100/H102 in `Uprava/handoffs/` for the delivery
pattern) — **this fork is not the canonical published site.**

## Common commands

```bash
npm install       # install dependencies
npm start         # local dev server with hot reload
npm run build     # build the static site into build/
npm run serve     # locally check the production build
npm run typecheck # tsc
npm run deploy    # publish to the gh-pages branch (GitHub Pages)
```

Node.js 18+ required; dependencies are lockfile-pinned, use `npm` (not `yarn`/`pnpm`).

## Key directories / files

| Path | Purpose |
|---|---|
| `docs/lessonN.mdx` | One MDX file per digitized lesson (N = 1–20 currently); `docs/intro.mdx` has the full acknowledgments/preface |
| `src/dictionary/{verb,noun,adjective,other}.tsv` | Exercise dictionary, schema `id⇥word⇥gender⇥translation⇥lesson⇥tag`, rendered by `Dictionary.tsx` |
| `src/components/Sanscript.tsx` | Renders `<Sanscript text="…" from="slp1" to="devanagari"/>` — SLP1→Devanāgarī transliteration via `@indic-transliteration/sanscript` |
| `src/components/Latin.tsx` | Renders `<Latin text="…"/>` — italicized IAST |
| `src/components/Dictionary.tsx` | Renders `<Dictionary/>` — dictionary tables from the TSVs above |
| `src/components/GrammaticalTerm.tsx` | Backs the `__GT_term__` / `__GTS_slp1__` MDX shorthand (see below) |
| `src/remark/grammaticalTermShorthand.ts`, `grammaticalTermSanskritShorthand.ts` | Remark plugins implementing the shorthand syntax |
| `sidebars.ts`, `docusaurus.config.ts` | Docusaurus site config/navigation |

## Conventions

- **MDX authoring shorthand** — every new lesson should use these rather than
  raw HTML/prose equivalents:
  - `<Sanscript text="…" from="slp1" to="devanagari"/>` for Devanāgarī rendering
  - `<Latin text="…"/>` for italic IAST
  - `<Dictionary/>` for the per-lesson vocabulary table
  - `__GT_термин__` for a styled grammatical term
  - `__GTS_slp1__` for "देवनागरी (IAST)" rendered from an SLP1 input
- **This is a fork, not upstream** — check `git remote -v` before assuming
  `origin`'s `main` is the canonical published branch; publish/deploy
  decisions and licensing belong to the upstream maintainer (Alexander
  Myltsev). New lessons/fixes are meant to flow back via PR to `upstream`,
  not just accumulate on this fork.
- **Licensing is unsettled** — per the README's own note, no explicit license
  is set yet pending an attribution decision for the 2008 electronic edition;
  don't add a LICENSE file or change distribution terms unilaterally.
- **GitHub Pages deploy is from the `gh-pages` branch** via `npm run deploy` —
  don't expect `main`'s HEAD to reflect the live site directly.
- Lessons 21–48 remain undigitized — don't assume full course coverage exists.

## What not to touch

- `build/`, `.docusaurus/`, `node_modules/` — generated/local build artifacts.
- `src/dictionary/*.tsv` — hand-curated exercise vocabulary; edit deliberately
  and check the `Dictionary.tsx` schema (`id⇥word⇥gender⇥translation⇥lesson⇥tag`)
  stays consistent across all four files.
