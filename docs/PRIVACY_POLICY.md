# Privacy Policy — Hired Hand: Resume Builder

_Last updated: 2026-09-20_

## Summary

Hired Hand: Resume Builder does not collect, transmit, or sell any user
data itself. Everything you enter stays on your own device, with one
opt-in exception: if you turn on **AI Suggestions** and supply your own
Anthropic API key, the specific resume text you ask it to improve is sent
directly from your browser to Anthropic's API — never to us, and never
automatically. See [AI Suggestions](#ai-suggestions-opt-in) below.

## What the extension stores

Resume content you enter (contact info, work history, education, skills,
etc.) is saved only to `chrome.storage.local` — Chrome's on-device storage
for this extension. It is never sent to any server as part of normal use of
the builder, export, or ATS-check features, which make no network requests
at all.

Uninstalling the extension, or clearing its storage from
`chrome://extensions`, deletes this data permanently. It is not backed up
anywhere else.

## AI Suggestions (opt-in)

AI Suggestions is an optional feature, off by default. Turning it on
requires you to supply your own Anthropic API key (get one at
[console.anthropic.com](https://console.anthropic.com/settings/keys)).

- Your key is stored only in `chrome.storage.local`, separately from your
  resume data, and is never sent anywhere except as the `x-api-key` on
  requests you trigger to `https://api.anthropic.com`.
- Anthropic only receives what a given suggestion needs — e.g. your
  current summary and a brief resume context for "Improve summary," or a
  single bullet's text for "Improve a bullet point" — never your full
  resume, and only when you click a suggestion button. Nothing is sent
  automatically or in the background.
- Requests to Anthropic are governed by
  [Anthropic's own privacy policy](https://www.anthropic.com/legal/privacy),
  not this one, once your browser sends them.
- Clicking "Forget API key" in the AI Suggestions panel deletes the stored
  key immediately and disables the feature.

## What the extension does not do

- No account, sign-in, or user identifier of any kind.
- No analytics, telemetry, or crash reporting.
- No advertising or third-party trackers.
- No access to your browsing history, other tabs, or other websites — the
  extension only reads and writes its own side panel, its own
  `chrome.storage.local` data, and (only when you use AI Suggestions)
  `https://api.anthropic.com`.

## Permissions

The extension requests these permissions, declared in
`manifest.config.ts`:

| Permission                     | Why                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `storage`                      | Save your resume profiles and (if you opt in) your AI Suggestions API key locally.        |
| `sidePanel`                    | Open the resume builder in Chrome's side panel instead of a popup.                        |
| `host_permissions` (Anthropic) | Reach `https://api.anthropic.com` — only used when you actively trigger an AI Suggestion. |

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
