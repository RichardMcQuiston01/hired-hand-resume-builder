import type {
  ProjectEntry,
  Recommendation,
  RecommendationRelationship,
  Resume,
} from '@richardmcquiston01/ats-resume-export';

export interface PortfolioContent {
  /** Featured projects in the order the user arranged them. */
  featuredProjects: ProjectEntry[];
  /** Only recommendations whose author agreed to be published. */
  publishableRecommendations: Recommendation[];
  /** Recommendations left out because the author has not given permission. */
  withheldRecommendationCount: number;
}

/**
 * Works out what a portfolio export contains: the featured projects (in the
 * chosen order, ignoring ids of projects since deleted) and the
 * recommendations the author has agreed to publish. Shared by the exporter
 * and the side panel so the UI can describe exactly what will be exported.
 */
export function selectPortfolioContent(resume: Resume): PortfolioContent {
  const projectsById: Map<string, ProjectEntry> = new Map(
    resume.projects.map((project) => [project.id, project]),
  );
  const seenIds: Set<string> = new Set();
  const featuredProjects: ProjectEntry[] = [];
  for (const projectId of resume.portfolio.featuredProjectIds) {
    const project: ProjectEntry | undefined = projectsById.get(projectId);
    if (project && !seenIds.has(projectId)) {
      seenIds.add(projectId);
      featuredProjects.push(project);
    }
  }

  const publishableRecommendations: Recommendation[] =
    resume.portfolio.recommendations.filter(
      (recommendation) =>
        recommendation.hasAuthorPermission &&
        recommendation.authorName.trim() !== '' &&
        recommendation.quote.trim() !== '',
    );

  return {
    featuredProjects,
    publishableRecommendations,
    withheldRecommendationCount:
      resume.portfolio.recommendations.length -
      publishableRecommendations.length,
  };
}

/** A filesystem-safe base name, e.g. "jordan-rivera-portfolio". */
export function portfolioFileBaseName(resume: Resume): string {
  const slug: string = resume.contact.fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length > 0 ? `${slug}-portfolio` : 'portfolio';
}

/** Matches a base64-encoded raster image, e.g. "data:image/png;base64,...". */
export const IMAGE_DATA_URL_PATTERN: RegExp =
  /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;

/**
 * Returns the URL only when it is a plain http(s) link, so a `javascript:`
 * or `data:` URL typed into a link field can never become a clickable link.
 */
export function safeHttpUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  try {
    const parsed: URL = new URL(value.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
      ? parsed.href
      : undefined;
  } catch {
    return undefined;
  }
}

/** How a recommendation's author relates to the portfolio owner; "" is omitted. */
export const RELATIONSHIP_LABELS: Record<RecommendationRelationship, string> = {
  manager: 'Manager',
  peer: 'Colleague',
  direct_report: 'Direct report',
  client: 'Client',
  mentor: 'Mentor',
  professor: 'Professor',
  other: '',
};
