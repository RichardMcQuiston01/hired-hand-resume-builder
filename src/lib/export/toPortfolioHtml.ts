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

export interface PortfolioHtmlOptions {
  /** Only the font family is used; a portfolio is a web page, not a print layout. */
  style?: StyleOption;
}

const FONT_STACKS: Record<FontFamily, string> = {
  'sans-serif': "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', Times, serif",
  monospace: "ui-monospace, 'Courier New', Courier, monospace",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function link(label: string, url: string | undefined): string {
  const href: string | undefined = safeHttpUrl(url);
  return href
    ? `<a href="${escapeHtml(href)}" rel="noopener noreferrer">${escapeHtml(label)}</a>`
    : '';
}

function paragraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== '')
    .map(
      (paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`,
    )
    .join('');
}

function screenshotHtml(screenshot: Screenshot): string {
  if (!IMAGE_DATA_URL_PATTERN.test(screenshot.dataUrl)) {
    return '';
  }
  return `<figure><img src="${screenshot.dataUrl}" alt="${escapeHtml(screenshot.altText)}"></figure>`;
}

function projectHtml(project: ProjectEntry): string {
  const links: string = [
    link('Source code', project.repoUrl),
    link('Live demo', project.demoUrl),
    // The general-purpose URL is only shown when it adds a link not already given.
    project.url !== project.repoUrl && project.url !== project.demoUrl
      ? link('Project link', project.url)
      : '',
  ]
    .filter((item) => item !== '')
    .join(' · ');
  const techStack: string = project.techStack
    .filter((tech) => tech.trim() !== '')
    .map((tech) => `<li>${escapeHtml(tech)}</li>`)
    .join('');
  const highlights: string = project.highlights
    .filter((highlight) => highlight.trim() !== '')
    .map((highlight) => `<li>${escapeHtml(highlight)}</li>`)
    .join('');
  const screenshots: string = project.screenshots
    .map(screenshotHtml)
    .filter((figure) => figure !== '')
    .join('');

  return [
    '<article class="project">',
    `<h3>${escapeHtml(project.name)}</h3>`,
    project.description ? paragraphs(project.description) : '',
    project.outcome
      ? `<p class="outcome"><strong>Outcome:</strong> ${escapeHtml(project.outcome)}</p>`
      : '',
    highlights ? `<ul>${highlights}</ul>` : '',
    techStack
      ? `<ul class="tags" aria-label="Technologies">${techStack}</ul>`
      : '',
    links ? `<p class="links">${links}</p>` : '',
    screenshots ? `<div class="screenshots">${screenshots}</div>` : '',
    '</article>',
  ].join('');
}

function recommendationHtml(recommendation: Recommendation): string {
  const roleParts: string[] = [
    recommendation.authorTitle,
    recommendation.authorCompany,
  ].filter((part): part is string => Boolean(part && part.trim()));
  const relationship: string = RELATIONSHIP_LABELS[recommendation.relationship];
  const source: string = link('View original', recommendation.sourceUrl);

  return [
    '<figure class="recommendation">',
    `<blockquote>${paragraphs(recommendation.quote)}</blockquote>`,
    '<figcaption>',
    `<strong>${escapeHtml(recommendation.authorName)}</strong>`,
    roleParts.length > 0 ? `, ${escapeHtml(roleParts.join(', '))}` : '',
    relationship ? ` · Relationship: ${escapeHtml(relationship)}` : '',
    source ? ` · ${source}` : '',
    '</figcaption>',
    '</figure>',
  ].join('');
}

const STYLES = `
:root { color-scheme: light dark; --fg: #1a1a1a; --muted: #555; --bg: #fff; --card: #f6f6f8; --accent: #1d4ed8; --border: #d8d8de; }
@media (prefers-color-scheme: dark) { :root { --fg: #ececf0; --muted: #a8a8b3; --bg: #15151a; --card: #1f1f27; --accent: #8ab4ff; --border: #34343f; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); line-height: 1.6; }
main { max-width: 52rem; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
h1 { font-size: 2.1rem; margin: 0 0 .25rem; }
h2 { font-size: 1.25rem; margin: 2.5rem 0 1rem; padding-bottom: .35rem; border-bottom: 1px solid var(--border); }
h3 { font-size: 1.1rem; margin: 0 0 .5rem; }
a { color: var(--accent); }
.contact { color: var(--muted); margin: 0 0 1.5rem; }
.project, .recommendation { background: var(--card); border: 1px solid var(--border); border-radius: .5rem; padding: 1rem 1.25rem; margin: 0 0 1rem; }
.tags { list-style: none; display: flex; flex-wrap: wrap; gap: .4rem; padding: 0; margin: .75rem 0; }
.tags li { border: 1px solid var(--border); border-radius: 999px; padding: .1rem .65rem; font-size: .85rem; }
.screenshots { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: .75rem; margin-top: .75rem; }
.screenshots figure { margin: 0; }
.screenshots img { width: 100%; height: auto; max-height: 24rem; object-fit: contain; border: 1px solid var(--border); border-radius: .25rem; }
blockquote { margin: 0 0 .5rem; padding-left: 1rem; border-left: 3px solid var(--accent); }
blockquote p { margin: 0 0 .5rem; }
figcaption { color: var(--muted); font-size: .9rem; }
.skills dt { font-weight: 600; }
.skills dd { margin: 0 0 .5rem; }
@media print { body { background: #fff; color: #000; } .project, .recommendation { break-inside: avoid; } }
`;

/**
 * Renders a portfolio as one self-contained HTML page: inline CSS, screenshots
 * embedded as data URLs, and no scripts or external requests, so it can be
 * attached to an application, emailed, or hosted as is.
 *
 * Includes the bio, the featured projects (in order), skills, and only the
 * recommendations whose author agreed to be published. All user text is
 * escaped, and only http(s) links and image data URLs are emitted.
 */
export function exportPortfolioAsHtml(
  resume: Resume,
  options: PortfolioHtmlOptions = {},
): string {
  const { featuredProjects, publishableRecommendations } =
    selectPortfolioContent(resume);
  const fontFamily: FontFamily =
    resolveExportStyle(options.style).fontFamily ?? 'sans-serif';
  const name: string = resume.contact.fullName.trim() || 'Portfolio';

  const contactItems: string[] = [
    resume.contact.email
      ? `<a href="mailto:${escapeHtml(encodeURIComponent(resume.contact.email))}">${escapeHtml(resume.contact.email)}</a>`
      : '',
    ...resume.contact.links.map((contactLink) =>
      link(contactLink.label.trim() || contactLink.url, contactLink.url),
    ),
    resume.contact.location ? escapeHtml(resume.contact.location) : '',
  ].filter((item) => item !== '');

  const skills: string = resume.skills
    .filter((group) => group.skills.length > 0)
    .map(
      (group) =>
        `<dt>${escapeHtml(group.category)}</dt><dd>${escapeHtml(group.skills.join(', '))}</dd>`,
    )
    .join('');
  const bio: string = resume.portfolio.bio?.trim() ?? '';

  const sections: string[] = [
    bio ? `<section><h2>About</h2>${paragraphs(bio)}</section>` : '',
    featuredProjects.length > 0
      ? `<section><h2>Projects</h2>${featuredProjects.map(projectHtml).join('')}</section>`
      : '',
    skills
      ? `<section><h2>Skills</h2><dl class="skills">${skills}</dl></section>`
      : '',
    publishableRecommendations.length > 0
      ? `<section><h2>Recommendations</h2>${publishableRecommendations.map(recommendationHtml).join('')}</section>`
      : '',
  ];

  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapeHtml(name)} – Portfolio</title>`,
    `<style>body { font-family: ${FONT_STACKS[fontFamily]}; }${STYLES}</style>`,
    '</head>',
    '<body>',
    '<main>',
    `<header><h1>${escapeHtml(name)}</h1>`,
    contactItems.length > 0
      ? `<p class="contact">${contactItems.join(' · ')}</p>`
      : '',
    '</header>',
    ...sections,
    '</main>',
    '</body>',
    '</html>',
  ].join('\n');
}
