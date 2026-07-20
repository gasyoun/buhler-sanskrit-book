# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Docusaurus 3.9.1 static site for Bühler's Sanskrit grammar book — 20 lessons in Russian with Sanskrit examples. Deployed to GitHub Pages at `/buhler-sanskrit-book/`.

## Commands

- `npm start` — Dev server with hot reload
- `npm run build` — Production build to `/build`
- `npm run typecheck` — TypeScript type checking
- `npm run serve` — Serve production build locally
- `npm run deploy` — Deploy to gh-pages branch

## Architecture

### Content (docs/)
MDX lesson files (`lesson1.mdx`–`lesson20.mdx`) with `sidebar_position` frontmatter. Sidebar is auto-generated from filesystem. Lessons use custom React components inline and are written in Russian.

### Dictionary Data (src/dictionary/)
Four TSV files (`verb.tsv`, `noun.tsv`, `adjective.tsv`, `other.tsv`) serve as vocabulary data. Each has an `id`, lesson number, and type-specific fields (root/class/stem for verbs, word/gender for nouns). Parsed at runtime with PapaParse.

### Custom Components (src/components/)
- **Dictionary.tsx** — Renders filtered TSV entries by `name` (verb|noun|adjective|other), `lesson`, and optional `tag`. Uses a `format` prop with `$field` placeholders (e.g., `$root – $translation`).
- **Sanscript.tsx** — Transliterates Sanskrit text between scripts (default: SLP1 → Devanagari) using `@indic-transliteration/sanscript`.
- **Latin.tsx** — Italic blue-styled Latin text.

### Remark Plugin (src/remark/grammaticalTermShorthand.ts)
Custom MDX remark plugin registered in `docusaurus.config.ts`. Transforms `GT_term` and `__GT_term__` patterns in Markdown into styled grammatical term spans. Uses `unist-util-visit` for AST traversal.

### TSV Import Support
A custom webpack plugin in `docusaurus.config.ts` enables importing `.tsv` files as raw strings. Type declaration at `src/types/tsv.d.ts`.

### Styling (src/css/custom.css)
Uses Docusaurus Infima CSS variables. Key component classes: `.sanscript-text` (Devanagari with Noto fonts), `.latin-text` (italic blue), `.grammatical-term` (green/yellow). All support dark mode via `[data-theme='dark']`.

## Operational hazard notes

Destructive-risk facts for this repo (do-not-rerun scripts, decoys, traps) are
registered centrally in an org-private hub
([Uprava DANGER_FACTS.md](https://github.com/gasyoun/Uprava/blob/main/DANGER_FACTS.md),
org members only); the public-safe subset is mirrored in the generated block of
[AGENTS.md](https://github.com/gasyoun/buhler-sanskrit-book/blob/main/AGENTS.md). Check them
before running anything that writes.
