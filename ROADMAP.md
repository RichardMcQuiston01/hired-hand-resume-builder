# Roadmap

This roadmap breaks the Hired Hand: Resume Builder Chrome extension into
development stages. Both repos in the Hired Hand family
(`hired-hand-resume-builder` and
[`resume-ats-vscode-ext`](https://github.com/RichardMcQuiston01/resume-ats-vscode-ext))
are currently scaffolding only (README/LICENSE), so there is no existing
code to port yet — but the two projects should converge on a shared resume
data schema so resumes built in one tool can be opened in the other.

## Stage 0 — Project Setup

- Scaffold the extension with Vite (`@crxjs/vite-plugin` or equivalent) and
  TypeScript, targeting Chrome Manifest V3.
- Configure ESLint/Prettier per the Google TypeScript Style Guide, strict
  `tsconfig`, and TailwindCSS for UI styling.
- Set up unit test runner (Vitest) and CI (lint, typecheck, test) on PRs.

## Stage 1 — Resume Data Model

- Define a typed, versioned resume schema (Contact, Summary, Experience,
  Education, Skills, Certifications, Projects) as the single source of
  truth for the UI, ATS engine, and exporters.
- This schema is the intended integration point with
  `resume-ats-vscode-ext`'s section-based template model — design it so
  JSON exported here can be imported there, and vice versa.
- Add schema validation (e.g. Zod) and fixtures for tests.

## Stage 2 — Builder UI

- Extension popup/side panel with a form per resume section, backed by the
  Stage 1 schema.
- Live preview pane rendering the in-progress resume.
- Support multiple saved resume profiles.

## Stage 3 — Storage & Persistence

- Persist resumes via `chrome.storage.local`/`sync`.
- Autosave, versioning/undo, and profile management (create, duplicate,
  delete).

## Stage 4 — ATS Compatibility Engine

- Structural checks (heading conventions, parseable dates, no tables/
  columns/images that break ATS parsers).
- Keyword/section-coverage feedback against a target job description.
- Surface actionable warnings in the builder UI.

## Stage 5 — Export Engine

- Exporters for TXT, JSON, HTML, DOCX, and PDF, all driven off the same
  schema.
- Round-trip test: export → re-import → schema-equal.

## Stage 6 — Import & Cross-Tool Compatibility

- Import existing resumes (JSON schema import first; best-effort DOCX/PDF
  text extraction later).
- Verify interoperability with `resume-ats-vscode-ext` once that project
  has an initial schema/implementation to target.

## Stage 7 — Polish & Release

- Accessibility pass (keyboard navigation, ARIA on the form UI).
- Cross-browser/Chromium version smoke testing.
- Store listing assets, privacy policy, and Chrome Web Store submission.

## Stretch Goals

- Optional account/cloud sync backend (Next.js + Prisma ORM) for
  cross-device resume storage.
- AI-assisted content suggestions (summary/bullet rewriting, keyword gap
  analysis).
- Shared npm package for the resume schema + validators, consumed by both
  the Chrome extension and the VS Code extension.
