# Roadmap

Hired Hand: Resume Builder has shipped its core feature set: a typed
resume data model, a builder UI with a live preview, local persistence
with autosave/undo, an ATS compatibility engine, export (TXT/JSON/HTML/
DOCX/PDF) and JSON import, an accessibility pass with automated
regression coverage, cross-browser/Chromium smoke testing, and optional
AI-assisted content suggestions. See git history and merged pull requests
for how each stage was built.

Both repos in the Hired Hand family (`hired-hand-resume-builder` and
[`resume-ats-vscode-ext`](https://github.com/RichardMcQuiston01/resume-ats-vscode-ext))
are intended to converge on a shared resume data schema so resumes built
in one tool can be opened in the other — see Stretch Goals below.

## Stretch Goals

- Optional account/cloud sync backend (Next.js + Prisma ORM) for
  cross-device resume storage.
- Shared npm package for the resume schema + validators, consumed by both
  the Chrome extension and the VS Code extension, to replace the informal
  JSON schema convergence above.
