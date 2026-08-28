# Changelog

All notable changes to **buhler-sanskrit-book** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed

- **H3603 — typecheck true red (OxAlpha, opencode `zai-coding-plan/glm-5.3-flash`,
  28-08-2026)**: `npm run typecheck` exits 0 again. `@docusaurus/module-type-aliases`
  3.9.1 ships no `@theme/Heading` declaration and a children-only `@theme/Layout`
  Props; declared the missing module and merged `title`/`description` into the
  Layout Props in `src/types/docusaurus.d.ts`. 26/26 vitest tests stay green.

## [0.1.1] - 2026-08-24


### Changed

- **H2820 — CLAUDE.md truth-pass** (Grok 4.6 `grok-4.6`, 16-08-2026). What this
  repo is (Docusaurus site for Bühler's 20 Russian lessons), how to run
  (`npm start` / `build` / `typecheck`), do-not-touch (`build/`, second
  dictionary parser; keep `rstTable*` in sync with SanskritGrammar). AGENTS.md
  twin regenerated.
## [0.1.0] - 2026-07-31

### Added
- **Initial changelog** (H2012 Phase F residual, Grok 4.5 `grok-4.5`): records current
  repository state after 85 commits since first recorded commit (2025-10-11). Historical
  detail was not reconstructed commit-by-commit; see `git log` for the full trail.
