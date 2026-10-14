import type { ReactElement } from 'react';

import {
  PORTFOLIO_MAX_FEATURED_PROJECTS,
  PORTFOLIO_MIN_FEATURED_PROJECTS,
  type ProjectEntry,
} from '@richardmcquiston01/ats-resume-export';

interface FeaturedProjectsSectionProps {
  projects: ProjectEntry[];
  featuredProjectIds: string[];
  onChange: (featuredProjectIds: string[]) => void;
}

function projectLabel(project: ProjectEntry): string {
  return project.name.trim() || 'Untitled project';
}

/** Describes whether the featured count is in the recommended range. */
function countHint(featuredCount: number): string {
  const range = `${PORTFOLIO_MIN_FEATURED_PROJECTS}–${PORTFOLIO_MAX_FEATURED_PROJECTS}`;
  if (featuredCount < PORTFOLIO_MIN_FEATURED_PROJECTS) {
    return `${featuredCount} featured. Hiring managers recommend ${range} standout projects.`;
  }
  if (featuredCount > PORTFOLIO_MAX_FEATURED_PROJECTS) {
    return `${featuredCount} featured. Quality beats quantity; consider trimming to ${range}.`;
  }
  return `${featuredCount} featured. That's within the recommended ${range}.`;
}

export function FeaturedProjectsSection({
  projects,
  featuredProjectIds,
  onChange,
}: FeaturedProjectsSectionProps): ReactElement {
  const projectsById: Map<string, ProjectEntry> = new Map(
    projects.map((project) => [project.id, project]),
  );
  // Ignore ids of projects that have since been deleted from the resume.
  const featuredProjects: ProjectEntry[] = featuredProjectIds
    .map((id) => projectsById.get(id))
    .filter((project): project is ProjectEntry => project !== undefined);
  const featuredIdSet: Set<string> = new Set(
    featuredProjects.map((project) => project.id),
  );
  const availableProjects: ProjectEntry[] = projects.filter(
    (project) => !featuredIdSet.has(project.id),
  );
  const orderedIds: string[] = featuredProjects.map((project) => project.id);

  function move(index: number, offset: -1 | 1): void {
    const targetIndex: number = index + offset;
    if (targetIndex < 0 || targetIndex >= orderedIds.length) {
      return;
    }
    const next: string[] = [...orderedIds];
    const [moved] = next.splice(index, 1);
    if (moved === undefined) {
      return;
    }
    next.splice(targetIndex, 0, moved);
    onChange(next);
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-ink-900">
        Featured projects
      </h2>
      {projects.length === 0 ? (
        <p className="text-sm text-ink-600">
          Add projects in the Resume Editor first, then choose which ones to
          feature here.
        </p>
      ) : (
        <>
          <p className="text-sm text-ink-600" aria-live="polite">
            {countHint(featuredProjects.length)}
          </p>
          {featuredProjects.length > 0 && (
            <ol className="flex flex-col gap-2">
              {featuredProjects.map((project, index) => (
                <li
                  key={project.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border-subtle px-3 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate font-medium text-ink-900">
                    {index + 1}. {projectLabel(project)}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => {
                        move(index, -1);
                      }}
                      aria-label={`Move ${projectLabel(project)} up`}
                      className="text-ink-600 hover:underline disabled:cursor-not-allowed disabled:text-ink-400 disabled:no-underline"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      disabled={index === orderedIds.length - 1}
                      onClick={() => {
                        move(index, 1);
                      }}
                      aria-label={`Move ${projectLabel(project)} down`}
                      className="text-ink-600 hover:underline disabled:cursor-not-allowed disabled:text-ink-400 disabled:no-underline"
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(orderedIds.filter((id) => id !== project.id));
                      }}
                      aria-label={`Remove ${projectLabel(project)} from featured projects`}
                      className="text-danger-600 hover:underline"
                    >
                      Unfeature
                    </button>
                  </span>
                </li>
              ))}
            </ol>
          )}
          {availableProjects.length > 0 && (
            <ul className="flex flex-col gap-2">
              {availableProjects.map((project) => (
                <li
                  key={project.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-dashed border-border-subtle px-3 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate text-ink-900">
                    {projectLabel(project)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onChange([...orderedIds, project.id]);
                    }}
                    aria-label={`Feature ${projectLabel(project)}`}
                    className="shrink-0 text-xs font-medium text-brand-700 hover:underline"
                  >
                    Feature
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
