# Hired Hand: Resume Builder

## Overview

Part of the Hired Hand family of Chrome extensions. TypeScript based Chrome Extension that allows users to build and export ATS compatible resumes. Formats available for export include TxT, JSON, HTML, DOCX,and PDF.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- npm 10+
- A Chromium-based browser (Chrome, Edge, Brave, etc.) for loading the
  unpacked extension during development

### Installation

```sh
npm install
```

### Usage

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

Load the extension locally:

1. Run `npm run build` (or `npm run dev` for a watch build).
2. Open `chrome://extensions`, enable **Developer mode**.
3. Click **Load unpacked** and select the `dist/` directory.
4. Click the extension's toolbar icon to open the resume builder in the
   browser's side panel.

### Examples

See [ROADMAP.md](./ROADMAP.md) for the planned development stages and
feature set.

## Privacy & Store Listing

The extension stores everything locally and makes no network requests — see
[docs/PRIVACY_POLICY.md](./docs/PRIVACY_POLICY.md). Chrome Web Store
listing copy and submission checklist:
[docs/STORE_LISTING.md](./docs/STORE_LISTING.md).

## Buy Me a Coffee

If this app, code, or repository has helped you or someone you know, please consider donating. I appreciate any help to offset the costs of development and/or AI Credits.

[**Donate via Stripe**](https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800), or scan:

[![Donate via Stripe](./donate.svg)](https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800)

## License

Apache 2

## Copyright

(c)2026 Richard McQuiston. All rights reserved.
