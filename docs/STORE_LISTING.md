# Chrome Web Store Listing

Draft copy and asset checklist for submitting Hired Hand: Resume Builder to
the Chrome Web Store. See ROADMAP.md Stage 7.

## Listing copy

**Name** (already set in `manifest.config.ts`)

> Hired Hand: Resume Builder

**Short description** (132 characters max — this is 97)

> Build, ATS-check, and export a resume as TXT, JSON, HTML, DOCX, or PDF — all from Chrome's side panel.

**Detailed description**

> Hired Hand: Resume Builder is a free Chrome extension for writing and
> exporting resumes that make it through Applicant Tracking Systems (ATS).
>
> - **Builder side panel** — fill in contact info, a summary, work
>   experience, education, skills, certifications, and projects, with a
>   live preview as you type.
> - **Multiple resume profiles** — keep separate resumes for different
>   roles, with autosave, undo, duplicate, and rename.
> - **ATS compatibility checks** — structural warnings (missing fields,
>   malformed dates, empty sections) plus a keyword match score against a
>   pasted job description.
> - **Export anywhere** — TXT, JSON, HTML, DOCX, and PDF, all generated
>   from the same data, with the PDF built as real, ATS-parseable text
>   rather than a flattened image.
> - **Import** — bring a previously exported JSON resume back in as a new
>   profile.
> - **Private by design** — everything is stored locally in your browser
>   via `chrome.storage.local`. Nothing is ever uploaded; the extension
>   makes no network requests at all. See the
>   [privacy policy](./PRIVACY_POLICY.md).
>
> Part of the Hired Hand family of Chrome extensions.

**Category**: Productivity

**Language**: English (United States)

## Assets

| Asset              | Requirement                       | Status                                                         |
| ------------------ | --------------------------------- | -------------------------------------------------------------- |
| Store icon         | 128×128 PNG                       | Done — `public/icons/icon128.png`                              |
| Small promo tile   | 440×280 PNG (optional)            | Not started                                                    |
| Marquee promo tile | 1400×560 PNG (optional)           | Not started                                                    |
| Screenshots        | 1280×800 or 640×400 PNG/JPEG, 1–5 | Source capture done — see below                                |
| Privacy policy URL | Public URL                        | Drafted — `docs/PRIVACY_POLICY.md`, needs a public hosting URL |

### Screenshots

`e2e/extension.spec.ts`'s Chromium smoke test captures a raw UI screenshot
of the builder at real side-panel width to
`store-assets/screenshots/side-panel.png` on every run (`npm run test:e2e`).
That capture is a 380×1800 source image, not a store-ready asset — it still
needs to be composited (e.g. cropped/padded onto a 1280×800 or 640×400
canvas, optionally with a browser chrome frame) into 1–5 final listing
screenshots. That compositing is a design task, not something this repo
automates.

## Remaining manual steps

These require the Chrome Web Store Developer Dashboard and can't be done
from this repository:

1. Register a Chrome Web Store developer account (one-time $5 fee).
2. Composite the raw screenshot capture(s) above into store-sized images.
3. Publish `docs/PRIVACY_POLICY.md` somewhere public (e.g. GitHub Pages, or
   rendered directly from the repo) and use that URL in the listing.
4. Upload a packaged build (`npm run build`, then zip the `dist/` output)
   to the dashboard along with the listing copy and assets above.
5. Fill out the Data Safety / permissions justification form — this
   extension's answer is short, since it requests only `storage` and
   `sidePanel` and makes no network requests (see the privacy policy).
6. Submit for review.
