# @hired-hand/resume-core

ATS-compatible resume model, validators, and exporters shared by the Hired Hand
tools (Chrome extension, VS Code extension, ...).

- **Exporters:** HTML, plain text, JSON (main entry); DOCX (`/docx`); PDF (`/pdf`).
- **ATS checks:** structural check and job-description keyword matching.
- **Validation your way:** a built-in dependency-free validator, a Zod schema,
  or any [Standard Schema](https://standardschema.dev) library.

## Install

```sh
npm install @hired-hand/resume-core
# only for the entries you import:
npm install docx      # "@hired-hand/resume-core/docx"
npm install pdf-lib   # "@hired-hand/resume-core/pdf"
npm install zod       # "@hired-hand/resume-core/zod"
```

The main entry has no dependencies. `docx`, `pdf-lib`, and `zod` are optional
peer dependencies, needed only by their own entry, so your app controls the
versions and can lazy-load the heavy ones (`await import('.../docx')`).

## Usage

```ts
import { checkResumeStructure, parseResume } from '@hired-hand/resume-core';
import { exportResumeAsPdf } from '@hired-hand/resume-core/pdf';

const resume = parseResume(JSON.parse(rawJson)); // throws a descriptive Error
const pdf: Blob = await exportResumeAsPdf(resume);
const findings = checkResumeStructure(resume);
```

Exporters return `Blob` (Node 18+ and browsers). In Node, write one with
`Buffer.from(await blob.arrayBuffer())`.

### Choosing a validator

| Style           | Import                                                                | Extra dependency |
| --------------- | --------------------------------------------------------------------- | ---------------- |
| Built-in        | `parseResume`, `safeParseResume`, `resumeValidator`                   | none             |
| Zod             | `resumeSchema`, `resumeDraftSchema`, `parseResume` from `/zod`        | `zod` ^4         |
| Standard Schema | pass any sync schema: `checkResumeStructure(r, { schema: mySchema })` | your library     |

```ts
import { resumeSchema } from '@hired-hand/resume-core/zod';

checkResumeStructure(resume, { schema: resumeSchema });
```

The plain `Resume` types are the source of truth. The Zod schema is verified at
compile time to infer exactly the same type, and a parity test suite checks that
both validators accept and reject the same inputs.

## Development

```sh
npm install --legacy-peer-deps
npm run typecheck && npm test && npm run build
```
