# Hired Hand: Resume Builder

## Overview

Part of the Hired Hand family of Chrome extensions. A TypeScript-based
Chrome extension for building, ATS-checking, and exporting a resume — all
from a side panel that stays open next to whatever job posting or
Applicant Tracking System (ATS) you're working against.

- Multiple resume profiles with autosave and undo
- Structural and keyword-based ATS compatibility checks
- Export to TXT, JSON, HTML, DOCX, and PDF
- Import a previously exported JSON resume
- Optional AI-assisted summary/bullet rewrites and keyword-gap
  suggestions, using your own Anthropic API key

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- npm 10+
- A Chromium-based browser (Chrome, Edge, Brave, etc.)

### Build and load the extension

The extension isn't published to the Chrome Web Store yet, so it's loaded
as an unpacked build:

```sh
npm install
npm run build
```

Then, in Chrome:

1. Open `chrome://extensions`, enable **Developer mode**.
2. Click **Load unpacked** and select the `dist/` directory.
3. Click the extension's toolbar icon to open the resume builder in the
   browser's side panel.

## Using the Extension

### Managing resume profiles

The bar at the top of the side panel manages your resume profiles — keep a
separate one for each role or industry you're applying to.

- **Active resume profile** dropdown — switch between saved profiles.
- **New** — create a blank profile.
- **Duplicate** — copy the active profile, including all its content.
- **Rename** — rename the active profile (Enter to save, Escape to
  cancel).
- **Delete** — remove the active profile (disabled when it's the last
  one).
- **Undo** — revert your most recent edit to the active profile.

Profiles save automatically a moment after you stop typing — there's no
explicit "Save" button.

### Filling in your resume

The left column has a form for every part of the resume; the right column
shows a live preview as you type. Fields marked with a red `*` are
required for the resume to pass ATS structural checks.

- **Contact** — name, email, phone, location, and any number of links
  (LinkedIn, GitHub, portfolio, etc.).
- **Summary** — a short professional summary/pitch.
- **Experience** — one entry per job: company, title, location, dates (or
  "I currently work here"), and a bulleted list of highlights.
- **Education** — one entry per school: institution, credential, dates,
  and highlights (honors, relevant coursework, etc.).
- **Skills** — one or more categories (e.g. "Languages," "Frameworks"),
  each with a list of skills.
- **Certifications** — name, issuer, issue/expiration dates, and an
  optional credential URL.
- **Projects** — name, description, an optional URL, and highlights.

### Checking ATS compatibility

The **ATS Check** section runs two kinds of checks:

- **Structural checks** run automatically and flag things that break
  Applicant Tracking Systems — missing required fields, malformed dates,
  an empty resume, a missing summary, or a highlight that still has a
  leading bullet character.
- **Keyword match** — paste a target job description into the **Job
  description** box to get a match score and the keywords from the
  posting that don't yet appear in your resume.

### Exporting your resume

The **Export** section generates a file from the active profile in five
formats — **TXT**, **JSON**, **HTML**, **DOCX**, or **PDF**. The PDF and
DOCX exports are real, ATS-parseable text, not a flattened image, and the
JSON export round-trips losslessly through **Import**.

### Importing a resume

The **Import** section reads a previously exported JSON file (from this
extension, or eventually from `resume-ats-vscode-ext`) and adds it as a
new profile, named after the file.

### AI Suggestions (optional)

The **AI Suggestions** section can rewrite your summary, rewrite a single
bullet point, or suggest ways to close keyword gaps against a job
description, using Claude. It's off by default:

1. Get an API key from [console.anthropic.com](https://console.anthropic.com/settings/keys).
2. Paste it into the AI Suggestions section and click **Save key**.
3. Use **Improve summary** (Apply/Discard the rewrite directly),
   **Improve a bullet point** (copies the rewrite to your clipboard), or
   **Suggest fixes** for keyword gaps against a pasted job description.

Your resume content is sent to Anthropic's API only when you click one of
these buttons — never automatically — and only the specific text that
suggestion needs, using the API key you supplied. **Forget API key** removes
the key and turns the feature back off at any time.

## Development

```sh
# Start Vite in extension dev mode (rebuilds on change)
npm run dev

# Type-check the project
npm run typecheck

# Lint
npm run lint

# Run the test suite (includes an automated accessibility check via jest-axe)
npm run test

# Cross-browser smoke test: builds and loads dist/ as an unpacked
# extension in real Chromium via Playwright. MV3 extension service
# workers aren't reliable in headless Chromium, so this launches a
# headed browser — it needs a real display, or `xvfb-run` on Linux:
#   xvfb-run npm run test:e2e
npm run test:e2e

# Production build (outputs to dist/)
npm run build
```

See [ROADMAP.md](./ROADMAP.md) for what's next.

## Buy Me a Coffee

If this app, code, or repository has helped you or someone you know, please consider donating. I appreciate any help to offset the costs of development and/or AI Credits.

[**Donate via Stripe**](https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800), or scan:

[![Donate via Stripe](./donate.svg)](https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800)

## License

Apache 2

## Copyright

(c)2026 Richard McQuiston. All rights reserved.
