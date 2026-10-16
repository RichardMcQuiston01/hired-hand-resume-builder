import type { ReactElement } from 'react';

import type { Resume } from '@richardmcquiston01/ats-resume-export';
import { PortfolioExportPanel } from './PortfolioExportPanel';
import { FeaturedProjectsSection } from './sections/FeaturedProjectsSection';
import { PortfolioBioSection } from './sections/PortfolioBioSection';
import { ProjectShowcaseSection } from './sections/ProjectShowcaseSection';
import { RecommendationsSection } from './sections/RecommendationsSection';

interface PortfolioFormProps {
  resume: Resume;
  onChange: (updater: (resume: Resume) => Resume) => void;
}

export function PortfolioForm({
  resume,
  onChange,
}: PortfolioFormProps): ReactElement {
  return (
    <div className="flex flex-col gap-6">
      <PortfolioBioSection
        bio={resume.portfolio.bio}
        onChange={(bio) => {
          onChange((prev) => ({
            ...prev,
            portfolio: { ...prev.portfolio, bio },
          }));
        }}
      />
      <FeaturedProjectsSection
        projects={resume.projects}
        featuredProjectIds={resume.portfolio.featuredProjectIds}
        onChange={(featuredProjectIds) => {
          onChange((prev) => ({
            ...prev,
            portfolio: { ...prev.portfolio, featuredProjectIds },
          }));
        }}
      />
      <ProjectShowcaseSection
        projects={resume.projects}
        onChange={(projects) => {
          onChange((prev) => ({ ...prev, projects }));
        }}
      />
      <RecommendationsSection
        entries={resume.portfolio.recommendations}
        onChange={(recommendations) => {
          onChange((prev) => ({
            ...prev,
            portfolio: { ...prev.portfolio, recommendations },
          }));
        }}
      />
      <PortfolioExportPanel resume={resume} />
    </div>
  );
}
