import type { ReactElement } from 'react';

import type { ProjectEntry } from '../../../lib/resume';
import { ScreenshotsField } from '../ui/ScreenshotsField';
import { TagInputField } from '../ui/TagInputField';
import { TextAreaField } from '../ui/TextAreaField';
import { TextField } from '../ui/TextField';

interface ProjectShowcaseSectionProps {
  projects: ProjectEntry[];
  onChange: (projects: ProjectEntry[]) => void;
}

/**
 * Portfolio-only details for each resume project (tech stack, links,
 * outcome, screenshots). The projects themselves are added and named in the
 * Resume Editor; this section only enriches them.
 */
export function ProjectShowcaseSection({
  projects,
  onChange,
}: ProjectShowcaseSectionProps): ReactElement {
  function updateProject(index: number, next: ProjectEntry): void {
    onChange(projects.map((project, i) => (i === index ? next : project)));
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-ink-900">Project details</h2>
      {projects.length === 0 && (
        <p className="text-sm text-ink-600">
          No projects yet. Add one in the Resume Editor to showcase it here.
        </p>
      )}
      {projects.map((project, index) => (
        <fieldset
          key={project.id}
          className="flex flex-col gap-2 rounded-md border border-border-subtle p-3"
        >
          <legend className="px-1 text-sm font-semibold text-ink-900">
            {project.name.trim() || 'Untitled project'}
          </legend>
          <TagInputField
            label={`Technologies for project ${index + 1}`}
            items={project.techStack}
            placeholder="React"
            onChange={(techStack) => {
              updateProject(index, { ...project, techStack });
            }}
          />
          <TextField
            label={`Repository URL for project ${index + 1}`}
            type="url"
            placeholder="https://github.com/..."
            value={project.repoUrl ?? ''}
            onChange={(repoUrl) => {
              updateProject(index, {
                ...project,
                repoUrl: repoUrl || undefined,
              });
            }}
          />
          <TextField
            label={`Live demo URL for project ${index + 1}`}
            type="url"
            placeholder="https://..."
            value={project.demoUrl ?? ''}
            onChange={(demoUrl) => {
              updateProject(index, {
                ...project,
                demoUrl: demoUrl || undefined,
              });
            }}
          />
          <TextAreaField
            label={`Outcome for project ${index + 1}`}
            placeholder="The result or impact, e.g. cut monthly reconciliation from 2 days to 2 hours."
            value={project.outcome ?? ''}
            onChange={(outcome) => {
              updateProject(index, {
                ...project,
                outcome: outcome || undefined,
              });
            }}
          />
          <ScreenshotsField
            projectName={project.name}
            screenshots={project.screenshots}
            onChange={(screenshots) => {
              updateProject(index, { ...project, screenshots });
            }}
          />
        </fieldset>
      ))}
    </section>
  );
}
