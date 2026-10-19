# CHANGELOG

## [1.1.0] - 2026-10-19

### Added

- **Export style options**: a **Style and details** section in Export lets you choose a preset (Compact, Standard, or
  Comfortable) and optionally set the font, text, name, and heading sizes, line and section spacing, margins, paper
  size, and heading case for the HTML, DOCX, and PDF exports. Out-of-range values are flagged and ignored, readability
  concerns (for example text under 10 pt) get a note, and the layout always stays a single column of real text, so the
  files stay ATS-friendly. Your choices are saved and apply to every profile.
- **Project and certification details** in exports: a project's links, tech stack, and outcome, and a certification's
  credential link can each be printed after the entry's name or on its own line (TXT, HTML, DOCX, and PDF). They are
  off by default.
- **Portfolio** (collapsed by default in the side panel): a bio, an ordered list of featured projects (three to five suggested),
  per-project details (tech stack, repository and demo links, outcome, screenshots), and recommendations with a flag for
  whether the author agreed to be published.
- **Portfolio export** as a self-contained HTML page or a PDF, each with its own download button. Both include only
  recommendations whose author agreed to be published, limit links to http(s), and embed screenshots; the PDF has
  clickable links. A WebP screenshot is converted to PNG when you add it (larger images are scaled down to 1600 px on
  the longest side) so it appears in both exports. A WebP saved before this release, or any screenshot the PDF cannot
  read, is skipped in the PDF with a notice; remove and re-add a WebP to convert it.
- **Portfolio readiness checks** in the ATS Check section: featured project count, a link, technologies, outcome and
  described screenshots per featured project, invalid links, a bio, and recommendations that will be left out or are too
  few. Nothing is shown until you start a portfolio.

### Changed

- The resume exporters, ATS checks, and resume model now come from the shared
  [`@richardmcquiston01/ats-resume-export`](https://www.npmjs.com/package/@richardmcquiston01/ats-resume-export)
  package (0.4.0), which the VS Code extension also uses. With every new option left at its default, your exports are
  unchanged apart from two fixes in that package: an entry with only one date no longer shows a dangling separator
  (for example `( - 2018-05)`), and an experience or education entry's location now appears after its name.

## [1.0.0] - 2026-09-21

- First release on the Chrome Web Store.
