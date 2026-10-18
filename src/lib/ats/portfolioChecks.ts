import {
  PORTFOLIO_MAX_FEATURED_PROJECTS,
  PORTFOLIO_MIN_FEATURED_PROJECTS,
} from '@richardmcquiston01/ats-resume-export';
import type {
  AtsFinding,
  ProjectEntry,
  Resume,
} from '@richardmcquiston01/ats-resume-export';
import { selectPortfolioContent } from '../export/portfolioContent';

/** Recommended number of recommendations: "a couple" from past colleagues. */
export const PORTFOLIO_MIN_RECOMMENDATIONS = 2;

function isHttpUrl(value: string): boolean {
  try {
    const protocol: string = new URL(value.trim()).protocol;
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

function hasText(value: string | undefined): value is string {
  return value !== undefined && value.trim() !== '';
}

/**
 * Whether the user has started building a portfolio. A portfolio is
 * optional, so a resume with none of it set up gets no portfolio findings at
 * all rather than a wall of "missing" messages.
 */
export function hasPortfolioContent(resume: Resume): boolean {
  const { portfolio, projects } = resume;
  return (
    hasText(portfolio.bio) ||
    portfolio.featuredProjectIds.length > 0 ||
    portfolio.recommendations.length > 0 ||
    projects.some(
      (project) =>
        project.techStack.length > 0 ||
        hasText(project.repoUrl) ||
        hasText(project.demoUrl) ||
        hasText(project.outcome) ||
        project.screenshots.length > 0,
    )
  );
}

function checkFeaturedProject(
  project: ProjectEntry,
  position: number,
): AtsFinding[] {
  const label: string = hasText(project.name)
    ? `"${project.name.trim()}"`
    : `Featured project ${position}`;
  const id = `portfolio.project.${project.id}`;
  const findings: AtsFinding[] = [];

  if (!hasText(project.name)) {
    findings.push({
      id: `${id}.name`,
      severity: 'warning',
      message: `${label} has no name.`,
    });
  }

  const links: { field: string; value: string | undefined }[] = [
    { field: 'repository', value: project.repoUrl },
    { field: 'live demo', value: project.demoUrl },
  ];
  const filledLinks = links.filter((link) => hasText(link.value));
  for (const link of filledLinks) {
    if (!isHttpUrl(link.value ?? '')) {
      findings.push({
        id: `${id}.${link.field}.invalid`,
        severity: 'warning',
        message: `${label}: the ${link.field} link is not a valid http(s) URL, so it will be left out of the portfolio.`,
      });
    }
  }
  if (filledLinks.length === 0 && !hasText(project.url)) {
    findings.push({
      id: `${id}.links`,
      severity: 'warning',
      message: `${label} has no repository or live demo link. Hiring managers want something they can click.`,
    });
  }

  if (project.techStack.every((tech) => tech.trim() === '')) {
    findings.push({
      id: `${id}.techStack`,
      severity: 'info',
      message: `${label} lists no technologies.`,
    });
  }
  if (!hasText(project.outcome)) {
    findings.push({
      id: `${id}.outcome`,
      severity: 'info',
      message: `${label} has no outcome. Describe the result or impact.`,
    });
  }
  if (project.screenshots.length === 0) {
    findings.push({
      id: `${id}.screenshots`,
      severity: 'info',
      message: `${label} has no screenshots. Visuals make a project easier to scan.`,
    });
  }
  const undescribed: number = project.screenshots.filter(
    (screenshot) => !hasText(screenshot.altText),
  ).length;
  if (undescribed > 0) {
    findings.push({
      id: `${id}.screenshots.alt`,
      severity: 'warning',
      message: `${label} has ${undescribed} screenshot${undescribed === 1 ? '' : 's'} without a description (alt text).`,
    });
  }

  return findings;
}

/**
 * Portfolio-readiness findings, in the same shape as the resume's structural
 * checks so they can be shown together. Returns an empty list when no
 * portfolio has been started (see `hasPortfolioContent`).
 */
export function checkPortfolio(resume: Resume): AtsFinding[] {
  if (!hasPortfolioContent(resume)) {
    return [];
  }

  const findings: AtsFinding[] = [];
  const { featuredProjects, publishableRecommendations } =
    selectPortfolioContent(resume);
  const { portfolio } = resume;

  if (!hasText(portfolio.bio)) {
    findings.push({
      id: 'portfolio.bio',
      severity: 'info',
      message:
        'The portfolio has no bio. A few sentences about your background and the role you want help readers connect.',
    });
  }

  const staleCount: number =
    portfolio.featuredProjectIds.length - featuredProjects.length;
  if (staleCount > 0) {
    findings.push({
      id: 'portfolio.featured.stale',
      severity: 'info',
      message: `${staleCount} featured project${staleCount === 1 ? ' refers' : 's refer'} to a project that no longer exists and will be ignored.`,
    });
  }

  if (featuredProjects.length === 0) {
    findings.push({
      id: 'portfolio.featured.none',
      severity: 'warning',
      message: `No featured projects, so the portfolio can't be exported. Feature ${PORTFOLIO_MIN_FEATURED_PROJECTS}–${PORTFOLIO_MAX_FEATURED_PROJECTS} standout projects.`,
    });
  } else if (featuredProjects.length < PORTFOLIO_MIN_FEATURED_PROJECTS) {
    findings.push({
      id: 'portfolio.featured.few',
      severity: 'info',
      message: `Only ${featuredProjects.length} featured project${featuredProjects.length === 1 ? '' : 's'}. ${PORTFOLIO_MIN_FEATURED_PROJECTS}–${PORTFOLIO_MAX_FEATURED_PROJECTS} standout projects show range.`,
    });
  } else if (featuredProjects.length > PORTFOLIO_MAX_FEATURED_PROJECTS) {
    findings.push({
      id: 'portfolio.featured.many',
      severity: 'info',
      message: `${featuredProjects.length} featured projects. Quality beats quantity; consider trimming to ${PORTFOLIO_MAX_FEATURED_PROJECTS}.`,
    });
  }

  featuredProjects.forEach((project, index) => {
    findings.push(...checkFeaturedProject(project, index + 1));
  });

  const withheld: number =
    portfolio.recommendations.length - publishableRecommendations.length;
  if (withheld > 0) {
    findings.push({
      id: 'portfolio.recommendations.withheld',
      severity: 'warning',
      message: `${withheld} recommendation${withheld === 1 ? ' is' : 's are'} left out of the portfolio: each needs the author's permission, a name, and the recommendation text.`,
    });
  }
  if (publishableRecommendations.length < PORTFOLIO_MIN_RECOMMENDATIONS) {
    findings.push({
      id: 'portfolio.recommendations.few',
      severity: 'info',
      message: `${publishableRecommendations.length} publishable recommendation${publishableRecommendations.length === 1 ? '' : 's'}. A couple from past employers or colleagues add credibility.`,
    });
  }

  return findings;
}
