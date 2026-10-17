import { describe, expect, it } from 'vitest';

import {
  createBlankProjectEntry,
  createBlankRecommendation,
  createBlankResume,
  createFixtureResume,
} from '@richardmcquiston01/ats-resume-export';
import type { Resume } from '@richardmcquiston01/ats-resume-export';
import { exportPortfolioAsHtml } from './toPortfolioHtml';

describe('exportPortfolioAsHtml', () => {
  it('renders the bio, featured project, screenshot, and permitted recommendation from the fixture', () => {
    const html: string = exportPortfolioAsHtml(createFixtureResume());

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Full-stack engineer who builds tools');
    expect(html).toContain('Hired Hand: Resume Builder');
    expect(html).toContain('Source code');
    expect(html).toContain('<img src="data:image/png;base64,');
    expect(html).toContain(
      'alt="The resume builder side panel next to a job posting."',
    );
    expect(html).toContain('Jordan Rivera');
    expect(html).toContain('View original');
  });

  it('is self-contained: no scripts or external resources', () => {
    const html: string = exportPortfolioAsHtml(createFixtureResume());

    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<link\b/i);
    expect(html).not.toMatch(/src="https?:/i);
  });

  it('leaves out recommendations without author permission', () => {
    const resume: Resume = createFixtureResume();
    const withheld: Resume = {
      ...resume,
      portfolio: {
        ...resume.portfolio,
        recommendations: resume.portfolio.recommendations.map(
          (recommendation) => ({
            ...recommendation,
            hasAuthorPermission: false,
          }),
        ),
      },
    };

    const html: string = exportPortfolioAsHtml(withheld);

    expect(html).not.toContain('billing migration');
    expect(html).not.toContain('Recommendations');
  });

  it('omits projects that are not featured', () => {
    const resume: Resume = createFixtureResume();
    const extra = { ...createBlankProjectEntry(), name: 'Secret Side Project' };
    const html: string = exportPortfolioAsHtml({
      ...resume,
      projects: [...resume.projects, extra],
    });

    expect(html).not.toContain('Secret Side Project');
  });

  it('escapes user text so it cannot inject markup', () => {
    const resume: Resume = createFixtureResume();
    const [project] = resume.projects;
    if (!project) {
      throw new Error('Fixture resume must have a project.');
    }
    const hostile: Resume = {
      ...resume,
      contact: { ...resume.contact, fullName: '<img src=x onerror=alert(1)>' },
      projects: [
        { ...project, name: '<script>alert(1)</script>', screenshots: [] },
      ],
    };

    const html: string = exportPortfolioAsHtml(hostile);

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('drops non-http links and non-image data URLs', () => {
    const resume: Resume = createFixtureResume();
    const [project] = resume.projects;
    const [screenshot] = project?.screenshots ?? [];
    if (!project || !screenshot) {
      throw new Error('Fixture resume must have a project screenshot.');
    }
    const hostile: Resume = {
      ...resume,
      projects: [
        {
          ...project,
          repoUrl: 'javascript:alert(1)',
          demoUrl: 'data:text/html;base64,PHNjcmlwdD4=',
          url: undefined,
          screenshots: [
            { ...screenshot, dataUrl: 'data:text/html;base64,PHNjcmlwdD4=' },
          ],
        },
      ],
    };

    const html: string = exportPortfolioAsHtml(hostile);

    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('Source code');
    expect(html).not.toContain('Live demo');
    expect(html).not.toContain('<img');
  });

  it('uses the font family from the chosen style', () => {
    const html: string = exportPortfolioAsHtml(createFixtureResume(), {
      style: { fontFamily: 'serif' },
    });

    expect(html).toContain('Georgia');
  });

  it('still renders a valid page for an empty resume', () => {
    const html: string = exportPortfolioAsHtml(createBlankResume());

    expect(html).toContain('<title>Portfolio – Portfolio</title>');
    expect(html).not.toContain('<h2>');
  });

  it('shows recommendation author details', () => {
    const resume: Resume = createBlankResume();
    const html: string = exportPortfolioAsHtml({
      ...resume,
      portfolio: {
        featuredProjectIds: [],
        recommendations: [
          {
            ...createBlankRecommendation(),
            authorName: 'Sam Lee',
            authorTitle: 'CTO',
            authorCompany: 'Initech',
            relationship: 'manager',
            quote: 'Ships reliably.',
            hasAuthorPermission: true,
          },
        ],
      },
    });

    expect(html).toContain('Sam Lee');
    expect(html).toContain('CTO, Initech');
    expect(html).toContain('Relationship: Manager');
  });
});
