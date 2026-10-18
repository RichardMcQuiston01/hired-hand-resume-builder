import type { PDFArray } from 'pdf-lib';
import { PDFDict, PDFDocument, PDFName, PDFString } from 'pdf-lib';
import { describe, expect, it } from 'vitest';

import {
  createBlankResume,
  createFixtureResume,
} from '@richardmcquiston01/ats-resume-export';
import type {
  ProjectEntry,
  Resume,
} from '@richardmcquiston01/ats-resume-export';
import { exportPortfolioAsPdf } from './toPortfolioPdf';

async function loadPdf(blob: Blob): Promise<PDFDocument> {
  return PDFDocument.load(await blob.arrayBuffer());
}

/** The URI of every link annotation on every page. */
function linkTargets(pdf: PDFDocument): string[] {
  const targets: string[] = [];
  for (const page of pdf.getPages()) {
    const annots: PDFArray | undefined = page.node.Annots();
    for (let index = 0; index < (annots?.size() ?? 0); index += 1) {
      const annotation: PDFDict | undefined = annots?.lookupMaybe(
        index,
        PDFDict,
      );
      const action: PDFDict | undefined = annotation?.lookupMaybe(
        PDFName.of('A'),
        PDFDict,
      );
      const uri: PDFString | undefined = action?.lookupMaybe(
        PDFName.of('URI'),
        PDFString,
      );
      if (uri) {
        targets.push(uri.decodeText());
      }
    }
  }
  return targets;
}

function firstProject(resume: Resume): ProjectEntry {
  const [project] = resume.projects;
  if (!project) {
    throw new Error('Fixture resume must have a project.');
  }
  return project;
}

describe('exportPortfolioAsPdf', () => {
  it('produces a readable PDF with the portfolio title and author', async () => {
    const resume: Resume = createFixtureResume();

    const { blob, skippedScreenshotCount } = await exportPortfolioAsPdf(resume);
    const pdf: PDFDocument = await loadPdf(blob);

    expect(blob.type).toBe('application/pdf');
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(pdf.getTitle()).toBe(`${resume.contact.fullName} - Portfolio`);
    expect(pdf.getAuthor()).toBe(resume.contact.fullName);
    expect(skippedScreenshotCount).toBe(0);
  });

  it('embeds PNG screenshots', async () => {
    const withImage = await exportPortfolioAsPdf(createFixtureResume());
    const resume: Resume = createFixtureResume();
    const withoutImage = await exportPortfolioAsPdf({
      ...resume,
      projects: [{ ...firstProject(resume), screenshots: [] }],
    });

    expect(withImage.blob.size).toBeGreaterThan(withoutImage.blob.size);
  });

  it('adds clickable links only for http(s) URLs', async () => {
    const resume: Resume = createFixtureResume();
    const { blob } = await exportPortfolioAsPdf({
      ...resume,
      projects: [
        {
          ...firstProject(resume),
          repoUrl: 'https://github.com/example/alpha',
          demoUrl: 'javascript:alert(1)',
          url: undefined,
        },
      ],
    });

    const targets: string[] = linkTargets(await loadPdf(blob));

    expect(targets).toContain('https://github.com/example/alpha');
    expect(targets.some((target) => target.startsWith('javascript:'))).toBe(
      false,
    );
  });

  it('counts WebP and unreadable screenshots as skipped instead of failing', async () => {
    const resume: Resume = createFixtureResume();
    const project: ProjectEntry = firstProject(resume);
    const [png] = project.screenshots;
    if (!png) {
      throw new Error('Fixture project must have a screenshot.');
    }

    const { skippedScreenshotCount } = await exportPortfolioAsPdf({
      ...resume,
      projects: [
        {
          ...project,
          screenshots: [
            {
              ...png,
              id: '00000000-0000-4000-8000-000000000001',
              dataUrl: 'data:image/webp;base64,UklGRg==',
            },
            {
              ...png,
              id: '00000000-0000-4000-8000-000000000002',
              dataUrl: 'data:image/png;base64,AAAA',
            },
            png,
          ],
        },
      ],
    });

    expect(skippedScreenshotCount).toBe(2);
  });

  it('does not throw on characters the standard PDF fonts cannot encode', async () => {
    const resume: Resume = createFixtureResume();

    const { blob } = await exportPortfolioAsPdf({
      ...resume,
      contact: { ...resume.contact, fullName: 'Zoë 山田 🚀' },
      portfolio: { ...resume.portfolio, bio: 'Builds things 🚀 \t quickly.' },
    });

    expect((await loadPdf(blob)).getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it('flows long content onto additional pages', async () => {
    const resume: Resume = createFixtureResume();
    const longText: string = 'Detailed paragraph text. '.repeat(400);

    const { blob } = await exportPortfolioAsPdf({
      ...resume,
      portfolio: { ...resume.portfolio, bio: longText },
    });

    expect((await loadPdf(blob)).getPageCount()).toBeGreaterThan(1);
  });

  it('uses the chosen page size', async () => {
    const { blob } = await exportPortfolioAsPdf(createFixtureResume(), {
      style: { pageSize: 'a4' },
    });

    const [page] = (await loadPdf(blob)).getPages();
    expect(page?.getWidth()).toBeCloseTo(595.28, 1);
  });

  it('still produces a valid PDF for an empty resume', async () => {
    const { blob } = await exportPortfolioAsPdf(createBlankResume());

    expect((await loadPdf(blob)).getPageCount()).toBe(1);
  });
});
