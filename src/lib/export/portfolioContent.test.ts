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
import {
  portfolioFileBaseName,
  selectPortfolioContent,
} from './portfolioContent';

function resumeWithProjects(names: string[]): Resume {
  const resume: Resume = createBlankResume();
  return {
    ...resume,
    projects: names.map((name) => ({ ...createBlankProjectEntry(), name })),
  };
}

function recommendation(overrides: Partial<Recommendation>): Recommendation {
  return {
    ...createBlankRecommendation(),
    authorName: 'Jordan Rivera',
    quote: 'Great to work with.',
    ...overrides,
  };
}

describe('selectPortfolioContent', () => {
  it('returns featured projects in the chosen order', () => {
    const resume: Resume = resumeWithProjects(['Alpha', 'Beta', 'Gamma']);
    const [alpha, beta, gamma] = resume.projects as [
      ProjectEntry,
      ProjectEntry,
      ProjectEntry,
    ];
    const reordered: Resume = {
      ...resume,
      portfolio: {
        ...resume.portfolio,
        featuredProjectIds: [gamma.id, alpha.id],
      },
    };

    const content = selectPortfolioContent(reordered);

    expect(content.featuredProjects.map((project) => project.name)).toEqual([
      'Gamma',
      'Alpha',
    ]);
    expect(content.featuredProjects).not.toContain(beta);
  });

  it('ignores unknown and duplicate featured ids', () => {
    const resume: Resume = resumeWithProjects(['Alpha']);
    const [alpha] = resume.projects as [ProjectEntry];
    const messy: Resume = {
      ...resume,
      portfolio: {
        ...resume.portfolio,
        featuredProjectIds: [
          '00000000-0000-4000-8000-000000000000',
          alpha.id,
          alpha.id,
        ],
      },
    };

    expect(selectPortfolioContent(messy).featuredProjects).toHaveLength(1);
  });

  it('only publishes recommendations the author agreed to', () => {
    const resume: Resume = {
      ...createBlankResume(),
      portfolio: {
        featuredProjectIds: [],
        recommendations: [
          recommendation({ hasAuthorPermission: true }),
          recommendation({ authorName: 'No Permission' }),
          recommendation({ hasAuthorPermission: true, quote: '   ' }),
        ],
      },
    };

    const content = selectPortfolioContent(resume);

    expect(content.publishableRecommendations).toHaveLength(1);
    expect(content.withheldRecommendationCount).toBe(2);
  });
});

describe('portfolioFileBaseName', () => {
  it('slugifies the full name', () => {
    const resume: Resume = createFixtureResume();

    expect(portfolioFileBaseName(resume)).toMatch(/^[a-z0-9-]+-portfolio$/);
  });

  it('falls back to a generic name when there is no full name', () => {
    expect(portfolioFileBaseName(createBlankResume())).toBe('portfolio');
  });
});
