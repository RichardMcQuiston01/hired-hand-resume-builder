import { describe, expect, it } from 'vitest';

import {
  createBlankProjectEntry,
  createBlankRecommendation,
  createBlankResume,
  createFixtureResume,
} from '@richardmcquiston01/ats-resume-export';
import type {
  ProjectEntry,
  Recommendation,
  Resume,
} from '@richardmcquiston01/ats-resume-export';
import { checkPortfolio, hasPortfolioContent } from './portfolioChecks';

function findingIds(resume: Resume): string[] {
  return checkPortfolio(resume).map((finding) => finding.id);
}

/** A resume with one featured project that has no portfolio details yet. */
function resumeWithBareFeaturedProject(): { resume: Resume; id: string } {
  const project: ProjectEntry = { ...createBlankProjectEntry(), name: 'Alpha' };
  const base: Resume = createBlankResume();
  return {
    id: project.id,
    resume: {
      ...base,
      projects: [project],
      portfolio: { ...base.portfolio, featuredProjectIds: [project.id] },
    },
  };
}

describe('hasPortfolioContent', () => {
  it('is false for a blank resume', () => {
    expect(hasPortfolioContent(createBlankResume())).toBe(false);
  });

  it('is true once any portfolio detail exists', () => {
    const resume: Resume = {
      ...createBlankResume(),
      projects: [{ ...createBlankProjectEntry(), techStack: ['React'] }],
    };

    expect(hasPortfolioContent(resume)).toBe(true);
  });
});

describe('checkPortfolio', () => {
  it('returns nothing when no portfolio has been started', () => {
    expect(checkPortfolio(createBlankResume())).toEqual([]);
  });

  it('only suggests more projects and recommendations for the fixture', () => {
    expect(findingIds(createFixtureResume())).toEqual([
      'portfolio.featured.few',
      'portfolio.recommendations.few',
    ]);
  });

  it('warns when nothing is featured', () => {
    const resume: Resume = {
      ...createBlankResume(),
      portfolio: {
        bio: 'Hi.',
        featuredProjectIds: [],
        recommendations: [],
      },
    };

    const ids: string[] = findingIds(resume);

    expect(ids).toContain('portfolio.featured.none');
    expect(
      checkPortfolio(resume).find((f) => f.id === 'portfolio.featured.none')
        ?.severity,
    ).toBe('warning');
  });

  it('flags a featured project missing links, technologies, outcome and screenshots', () => {
    const { resume, id } = resumeWithBareFeaturedProject();

    const ids: string[] = findingIds(resume);

    expect(ids).toEqual(
      expect.arrayContaining([
        'portfolio.bio',
        `portfolio.project.${id}.links`,
        `portfolio.project.${id}.techStack`,
        `portfolio.project.${id}.outcome`,
        `portfolio.project.${id}.screenshots`,
      ]),
    );
  });

  it('accepts the general-purpose project URL as a link', () => {
    const { resume, id } = resumeWithBareFeaturedProject();
    const [project] = resume.projects as [ProjectEntry];

    const ids: string[] = findingIds({
      ...resume,
      projects: [{ ...project, url: 'https://example.com' }],
    });

    expect(ids).not.toContain(`portfolio.project.${id}.links`);
  });

  it('warns about a repository link that is not http(s)', () => {
    const { resume, id } = resumeWithBareFeaturedProject();
    const [project] = resume.projects as [ProjectEntry];

    const ids: string[] = findingIds({
      ...resume,
      projects: [{ ...project, repoUrl: 'javascript:alert(1)' }],
    });

    expect(ids).toContain(`portfolio.project.${id}.repository.invalid`);
    expect(ids).not.toContain(`portfolio.project.${id}.links`);
  });

  it('warns about screenshots without a description', () => {
    const resume: Resume = createFixtureResume();
    const [project] = resume.projects as [ProjectEntry];
    const [screenshot] = project.screenshots;
    if (!screenshot) {
      throw new Error('Fixture project must have a screenshot.');
    }

    const ids: string[] = findingIds({
      ...resume,
      projects: [
        { ...project, screenshots: [{ ...screenshot, altText: '  ' }] },
      ],
    });

    expect(ids).toContain(`portfolio.project.${project.id}.screenshots.alt`);
  });

  it('notes featured projects that no longer exist and ones beyond the recommended maximum', () => {
    const base: Resume = createBlankResume();
    const projects: ProjectEntry[] = Array.from({ length: 6 }, (_, index) => ({
      ...createBlankProjectEntry(),
      name: `P${index}`,
      repoUrl: 'https://example.com',
    }));
    const resume: Resume = {
      ...base,
      projects,
      portfolio: {
        ...base.portfolio,
        featuredProjectIds: [
          ...projects.map((project) => project.id),
          '00000000-0000-4000-8000-000000000000',
        ],
      },
    };

    const ids: string[] = findingIds(resume);

    expect(ids).toContain('portfolio.featured.many');
    expect(ids).toContain('portfolio.featured.stale');
  });

  it('reports recommendations that will be left out', () => {
    const resume: Resume = createFixtureResume();
    const unpermitted: Recommendation = {
      ...createBlankRecommendation(),
      authorName: 'Sam Lee',
      quote: 'Ships reliably.',
      hasAuthorPermission: false,
    };

    const ids: string[] = findingIds({
      ...resume,
      portfolio: {
        ...resume.portfolio,
        recommendations: [...resume.portfolio.recommendations, unpermitted],
      },
    });

    expect(ids).toContain('portfolio.recommendations.withheld');
    expect(ids).toContain('portfolio.recommendations.few');
  });

  it('is clean with enough complete projects and recommendations', () => {
    const base: Resume = createFixtureResume();
    const [template] = base.projects as [ProjectEntry];
    const projects: ProjectEntry[] = [0, 1, 2].map((index) => ({
      ...template,
      id: `00000000-0000-4000-8000-00000000000${index}`,
      name: `Project ${index}`,
    }));
    const [recommendation] = base.portfolio.recommendations as [Recommendation];

    const resume: Resume = {
      ...base,
      projects,
      portfolio: {
        ...base.portfolio,
        featuredProjectIds: projects.map((project) => project.id),
        recommendations: [
          recommendation,
          { ...recommendation, id: '00000000-0000-4000-8000-0000000000aa' },
        ],
      },
    };

    expect(checkPortfolio(resume)).toEqual([]);
  });
});
