import type { PDFFont, PDFPage } from 'pdf-lib';
import { PDFDocument, PDFString, rgb, StandardFonts } from 'pdf-lib';
import { resolveExportStyle } from '@richardmcquiston01/ats-resume-export';
import type {
  FontFamily,
  ProjectEntry,
  Recommendation,
  Resume,
  Screenshot,
  StyleOption,
} from '@richardmcquiston01/ats-resume-export';
import {
  IMAGE_DATA_URL_PATTERN,
  RELATIONSHIP_LABELS,
  safeHttpUrl,
  selectPortfolioContent,
} from './portfolioContent';

export interface PortfolioPdfOptions {
  /** Font family and page size are used; other layout options are not. */
  style?: StyleOption;
}

export interface PortfolioPdfResult {
  blob: Blob;
  /** Screenshots left out: WebP (not supported by PDF) or unreadable images. */
  skippedScreenshotCount: number;
}

const PAGE_SIZES: Record<'letter' | 'a4', { width: number; height: number }> = {
  letter: { width: 612, height: 792 },
  a4: { width: 595.28, height: 841.89 },
};

const FONTS: Record<
  FontFamily,
  { regular: StandardFonts; bold: StandardFonts; italic: StandardFonts }
> = {
  'sans-serif': {
    regular: StandardFonts.Helvetica,
    bold: StandardFonts.HelveticaBold,
    italic: StandardFonts.HelveticaOblique,
  },
  serif: {
    regular: StandardFonts.TimesRoman,
    bold: StandardFonts.TimesRomanBold,
    italic: StandardFonts.TimesRomanItalic,
  },
  monospace: {
    regular: StandardFonts.Courier,
    bold: StandardFonts.CourierBold,
    italic: StandardFonts.CourierOblique,
  },
};

const MARGIN = 54;
const BODY_SIZE = 10;
const LINE_HEIGHT_RATIO = 1.35;
const MAX_IMAGE_HEIGHT = 200;
const TEXT_COLOR = rgb(0.12, 0.16, 0.22);
const MUTED_COLOR = rgb(0.35, 0.38, 0.44);
const LINK_COLOR = rgb(0.11, 0.31, 0.85);

interface TextOptions {
  font: PDFFont;
  size: number;
  indent?: number;
  gapAfter?: number;
  color?: ReturnType<typeof rgb>;
}

/**
 * Standard PDF fonts only encode a Latin character set, and pdf-lib throws on
 * anything else. Replaces each unencodable character with "?" so exporting
 * text with, say, emoji or CJK degrades visibly instead of failing.
 */
function makeEncodable(font: PDFFont): (text: string) => string {
  const cache: Map<string, boolean> = new Map();
  function canEncode(character: string): boolean {
    const cached: boolean | undefined = cache.get(character);
    if (cached !== undefined) {
      return cached;
    }
    let result = true;
    try {
      font.encodeText(character);
    } catch {
      result = false;
    }
    cache.set(character, result);
    return result;
  }
  return (text) =>
    Array.from(text.replace(/[\t\r]+/g, ' '))
      .map((character) => (canEncode(character) ? character : '?'))
      .join('');
}

function decodeDataUrl(dataUrl: string): Uint8Array {
  const base64: string = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const binary: string = atob(base64);
  const bytes: Uint8Array = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

class PortfolioPdfWriter {
  private page: PDFPage;
  private y: number;
  private readonly contentWidth: number;

  constructor(
    private readonly doc: PDFDocument,
    private readonly pageWidth: number,
    private readonly pageHeight: number,
    private readonly fonts: {
      regular: PDFFont;
      bold: PDFFont;
      italic: PDFFont;
    },
  ) {
    this.page = doc.addPage([pageWidth, pageHeight]);
    this.y = pageHeight - MARGIN;
    this.contentWidth = pageWidth - MARGIN * 2;
  }

  private ensureSpace(height: number): void {
    if (this.y - height < MARGIN) {
      this.page = this.doc.addPage([this.pageWidth, this.pageHeight]);
      this.y = this.pageHeight - MARGIN;
    }
  }

  gap(height: number): void {
    this.y -= height;
  }

  private wrap(
    text: string,
    font: PDFFont,
    size: number,
    width: number,
  ): string[] {
    const lines: string[] = [];
    for (const paragraph of text.split('\n')) {
      const words: string[] = paragraph.split(/\s+/).filter(Boolean);
      let current = '';
      for (const word of words) {
        const candidate: string = current ? `${current} ${word}` : word;
        if (current && font.widthOfTextAtSize(candidate, size) > width) {
          lines.push(current);
          current = word;
        } else {
          current = candidate;
        }
      }
      if (current) {
        lines.push(current);
      }
    }
    return lines;
  }

  write(text: string, options: TextOptions): void {
    const indent: number = options.indent ?? 0;
    const lineHeight: number = options.size * LINE_HEIGHT_RATIO;
    const lines: string[] = this.wrap(
      text,
      options.font,
      options.size,
      this.contentWidth - indent,
    );
    for (const line of lines) {
      this.ensureSpace(lineHeight);
      this.page.drawText(line, {
        x: MARGIN + indent,
        y: this.y - options.size,
        size: options.size,
        font: options.font,
        color: options.color ?? TEXT_COLOR,
      });
      this.y -= lineHeight;
    }
    this.y -= options.gapAfter ?? 0;
  }

  heading(text: string): void {
    this.gap(10);
    this.ensureSpace(40);
    this.write(text.toUpperCase(), {
      font: this.fonts.bold,
      size: 11,
      gapAfter: 1,
    });
    this.page.drawLine({
      start: { x: MARGIN, y: this.y + 2 },
      end: { x: MARGIN + this.contentWidth, y: this.y + 2 },
      thickness: 0.6,
      color: MUTED_COLOR,
    });
    this.gap(6);
  }

  /** Writes a clickable link on one line, shortening the shown text to fit. */
  link(label: string, url: string, indent = 0): void {
    const font: PDFFont = this.fonts.regular;
    const available: number = this.contentWidth - indent;
    let shown = `${label}: ${url}`;
    while (
      shown.length > label.length + 4 &&
      font.widthOfTextAtSize(shown, BODY_SIZE) > available
    ) {
      shown = `${shown.slice(0, -2)}…`;
    }
    const lineHeight: number = BODY_SIZE * LINE_HEIGHT_RATIO;
    this.ensureSpace(lineHeight);
    const x: number = MARGIN + indent;
    const width: number = font.widthOfTextAtSize(shown, BODY_SIZE);
    this.page.drawText(shown, {
      x,
      y: this.y - BODY_SIZE,
      size: BODY_SIZE,
      font,
      color: LINK_COLOR,
    });
    const annotation = this.doc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [x, this.y - BODY_SIZE - 2, x + width, this.y - 1],
      Border: [0, 0, 0],
      A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
    });
    this.page.node.addAnnot(this.doc.context.register(annotation));
    this.y -= lineHeight;
  }

  /** Draws an image scaled to fit, followed by its description. */
  async image(
    bytes: Uint8Array,
    isPng: boolean,
    caption: string,
    indent = 0,
  ): Promise<void> {
    const embedded = isPng
      ? await this.doc.embedPng(bytes)
      : await this.doc.embedJpg(bytes);
    const maxWidth: number = this.contentWidth - indent;
    const scale: number = Math.min(
      1,
      maxWidth / embedded.width,
      MAX_IMAGE_HEIGHT / embedded.height,
    );
    const width: number = embedded.width * scale;
    const height: number = embedded.height * scale;
    this.ensureSpace(height + 14);
    this.page.drawImage(embedded, {
      x: MARGIN + indent,
      y: this.y - height,
      width,
      height,
    });
    this.y -= height + 3;
    this.write(caption, {
      font: this.fonts.italic,
      size: 8,
      indent,
      color: MUTED_COLOR,
      gapAfter: 4,
    });
  }
}

async function writeProject(
  writer: PortfolioPdfWriter,
  project: ProjectEntry,
  fonts: { regular: PDFFont; bold: PDFFont; italic: PDFFont },
  encodable: (text: string) => string,
): Promise<number> {
  let skippedScreenshots = 0;
  writer.write(encodable(project.name.trim() || 'Untitled project'), {
    font: fonts.bold,
    size: 12,
    gapAfter: 2,
  });
  if (project.description.trim()) {
    writer.write(encodable(project.description.trim()), {
      font: fonts.regular,
      size: BODY_SIZE,
      gapAfter: 2,
    });
  }
  if (project.outcome?.trim()) {
    writer.write(`Outcome: ${encodable(project.outcome.trim())}`, {
      font: fonts.regular,
      size: BODY_SIZE,
      gapAfter: 2,
    });
  }
  for (const highlight of project.highlights) {
    if (highlight.trim()) {
      writer.write(`- ${encodable(highlight.trim())}`, {
        font: fonts.regular,
        size: BODY_SIZE,
        indent: 8,
      });
    }
  }
  const techStack: string[] = project.techStack.filter((tech) => tech.trim());
  if (techStack.length > 0) {
    writer.write(`Technologies: ${encodable(techStack.join(', '))}`, {
      font: fonts.italic,
      size: BODY_SIZE,
      gapAfter: 2,
    });
  }
  const links: { label: string; url: string | undefined }[] = [
    { label: 'Source code', url: safeHttpUrl(project.repoUrl) },
    { label: 'Live demo', url: safeHttpUrl(project.demoUrl) },
    {
      label: 'Project link',
      url:
        project.url !== project.repoUrl && project.url !== project.demoUrl
          ? safeHttpUrl(project.url)
          : undefined,
    },
  ];
  for (const { label, url } of links) {
    if (url) {
      writer.link(label, url);
    }
  }

  for (const screenshot of project.screenshots) {
    const written: boolean = await writeScreenshot(
      writer,
      screenshot,
      encodable,
    );
    if (!written) {
      skippedScreenshots += 1;
    }
  }
  writer.gap(8);
  return skippedScreenshots;
}

/** Returns whether the screenshot was embedded. Never throws. */
async function writeScreenshot(
  writer: PortfolioPdfWriter,
  screenshot: Screenshot,
  encodable: (text: string) => string,
): Promise<boolean> {
  if (!IMAGE_DATA_URL_PATTERN.test(screenshot.dataUrl)) {
    return false;
  }
  const isPng: boolean = screenshot.dataUrl.startsWith('data:image/png');
  const isJpeg: boolean = screenshot.dataUrl.startsWith('data:image/jpeg');
  if (!isPng && !isJpeg) {
    return false;
  }
  try {
    await writer.image(
      decodeDataUrl(screenshot.dataUrl),
      isPng,
      encodable(screenshot.altText.trim() || 'Screenshot'),
    );
    return true;
  } catch (imageError: unknown) {
    console.error(
      'Skipped a screenshot that could not be embedded.',
      imageError,
    );
    return false;
  }
}

function writeRecommendation(
  writer: PortfolioPdfWriter,
  recommendation: Recommendation,
  fonts: { regular: PDFFont; bold: PDFFont; italic: PDFFont },
  encodable: (text: string) => string,
): void {
  writer.write(`"${encodable(recommendation.quote.trim())}"`, {
    font: fonts.italic,
    size: BODY_SIZE,
    indent: 8,
    gapAfter: 2,
  });
  const role: string = [
    recommendation.authorTitle,
    recommendation.authorCompany,
    RELATIONSHIP_LABELS[recommendation.relationship]
      ? `Relationship: ${RELATIONSHIP_LABELS[recommendation.relationship]}`
      : undefined,
  ]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(', ');
  writer.write(
    encodable(
      role
        ? `${recommendation.authorName.trim()}, ${role}`
        : recommendation.authorName.trim(),
    ),
    { font: fonts.bold, size: 9, indent: 8, color: MUTED_COLOR },
  );
  const sourceUrl: string | undefined = safeHttpUrl(recommendation.sourceUrl);
  if (sourceUrl) {
    writer.link('View original', sourceUrl, 8);
  }
  writer.gap(8);
}

/**
 * Renders a portfolio as a PDF with pdf-lib: bio, featured projects (links
 * are clickable, PNG/JPEG screenshots are embedded with their descriptions),
 * skills, and only the recommendations whose author agreed to be published.
 * WebP screenshots can't be embedded in a PDF and are counted in
 * `skippedScreenshotCount` so the caller can tell the user.
 */
export async function exportPortfolioAsPdf(
  resume: Resume,
  options: PortfolioPdfOptions = {},
): Promise<PortfolioPdfResult> {
  const style = resolveExportStyle(options.style);
  const family: FontFamily = style.fontFamily ?? 'sans-serif';
  const pageSize = PAGE_SIZES[style.pageSize ?? 'letter'];
  const { featuredProjects, publishableRecommendations } =
    selectPortfolioContent(resume);

  const doc: PDFDocument = await PDFDocument.create();
  const fonts = {
    regular: await doc.embedFont(FONTS[family].regular),
    bold: await doc.embedFont(FONTS[family].bold),
    italic: await doc.embedFont(FONTS[family].italic),
  };
  const encodable = makeEncodable(fonts.regular);
  const writer = new PortfolioPdfWriter(
    doc,
    pageSize.width,
    pageSize.height,
    fonts,
  );

  const name: string = resume.contact.fullName.trim() || 'Portfolio';
  doc.setTitle(`${name} - Portfolio`);
  doc.setAuthor(name);
  doc.setCreator('Hired Hand: Resume Builder');

  writer.write(encodable(name), { font: fonts.bold, size: 22, gapAfter: 2 });
  const contactLine: string = [resume.contact.email, resume.contact.location]
    .filter((part): part is string => Boolean(part?.trim()))
    .join('  |  ');
  if (contactLine) {
    writer.write(encodable(contactLine), {
      font: fonts.regular,
      size: BODY_SIZE,
      color: MUTED_COLOR,
    });
  }
  for (const contactLink of resume.contact.links) {
    const url: string | undefined = safeHttpUrl(contactLink.url);
    if (url) {
      writer.link(encodable(contactLink.label.trim() || 'Link'), url);
    }
  }

  const bio: string = resume.portfolio.bio?.trim() ?? '';
  if (bio) {
    writer.heading('About');
    writer.write(encodable(bio), { font: fonts.regular, size: BODY_SIZE });
  }

  let skippedScreenshotCount = 0;
  if (featuredProjects.length > 0) {
    writer.heading('Projects');
    for (const project of featuredProjects) {
      skippedScreenshotCount += await writeProject(
        writer,
        project,
        fonts,
        encodable,
      );
    }
  }

  const skillGroups = resume.skills.filter((group) => group.skills.length > 0);
  if (skillGroups.length > 0) {
    writer.heading('Skills');
    for (const group of skillGroups) {
      writer.write(
        `${encodable(group.category)}: ${encodable(group.skills.join(', '))}`,
        { font: fonts.regular, size: BODY_SIZE, gapAfter: 2 },
      );
    }
  }

  if (publishableRecommendations.length > 0) {
    writer.heading('Recommendations');
    for (const recommendation of publishableRecommendations) {
      writeRecommendation(writer, recommendation, fonts, encodable);
    }
  }

  const bytes: Uint8Array = await doc.save();
  return {
    blob: new Blob([bytes as BlobPart], { type: 'application/pdf' }),
    skippedScreenshotCount,
  };
}
