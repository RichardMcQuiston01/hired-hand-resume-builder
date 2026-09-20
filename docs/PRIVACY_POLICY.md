# Privacy Policy — Hired Hand: Resume Builder

_Last updated: 2026-09-20_

## Summary

Hired Hand: Resume Builder does not collect, transmit, or sell any user
data. Everything you enter stays on your own device.

## What the extension stores

Resume content you enter (contact info, work history, education, skills,
etc.) is saved only to `chrome.storage.local` — Chrome's on-device storage
for this extension. It is never sent to any server, because the extension
makes no network requests at all: it has no `host_permissions` and talks to
no external API.

Uninstalling the extension, or clearing its storage from
`chrome://extensions`, deletes this data permanently. It is not backed up
anywhere else.

## What the extension does not do

- No account, sign-in, or user identifier of any kind.
- No analytics, telemetry, or crash reporting.
- No advertising or third-party trackers.
- No access to your browsing history, other tabs, or other websites — the
  extension only reads and writes its own side panel and its own
  `chrome.storage.local` data.

## Permissions

The extension requests two Chrome permissions, declared in
`manifest.config.ts`:

| Permission  | Why                                                                 |
| ----------- | ------------------------------------------------------------------- |
| `storage`   | Save your resume profiles locally so they persist between sessions. |
| `sidePanel` | Open the resume builder in Chrome's side panel instead of a popup.  |

## Exported files

When you export a resume (TXT, JSON, HTML, DOCX, or PDF), the file is
generated locally in your browser and saved via a normal browser download.
Nothing is uploaded.

## Changes to this policy

If this policy changes, the updated version will be published in this file
and in the extension's Chrome Web Store listing, with the "Last updated"
date above revised accordingly.

## Contact

Questions about this policy can be filed as an issue on the
[project repository](https://github.com/RichardMcQuiston01/hired-hand-resume-builder).
