import type { ReactElement } from 'react';

import type { Resume } from '../../lib/resume';

interface ResumePreviewProps {
  resume: Resume;
}

function formatDateRange(
  startDate: string | undefined,
  endDate: string | undefined,
  isCurrent: boolean,
): string {
  const start = startDate || '—';
  const end = isCurrent ? 'Present' : endDate || '—';
  return `${start} – ${end}`;
}

export function ResumePreview({ resume }: ResumePreviewProps): ReactElement {
  const { contact } = resume;

  return (
    <article className="flex flex-col gap-4 bg-white p-4 text-slate-900">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">{contact.fullName || 'Your Name'}</h1>
        <p className="text-sm text-slate-600">
          {[contact.email, contact.phone, contact.location]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {contact.links.length > 0 && (
          <p className="text-sm text-slate-600">
            {contact.links
              .map((link) => link.label || link.url)
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </header>

      {resume.summary && (
        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Summary
          </h2>
          <p className="text-sm">{resume.summary}</p>
        </section>
      )}

      {resume.experience.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Experience
          </h2>
          {resume.experience.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium">
                  {entry.title || 'Title'}
                  {entry.company ? ` · ${entry.company}` : ''}
                </p>
                <p className="shrink-0 text-xs text-slate-500">
                  {formatDateRange(
                    entry.startDate,
                    entry.endDate,
                    entry.isCurrent,
                  )}
                </p>
              </div>
              {entry.highlights.filter(Boolean).length > 0 && (
                <ul className="list-disc pl-5 text-sm">
                  {entry.highlights.filter(Boolean).map((highlight, index) => (
                    // Highlight text has no stable id; index-keyed is fine
                    // for this read-only, append/remove-driven list.
                    <li key={index}>{highlight}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {resume.education.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Education
          </h2>
          {resume.education.map((entry) => (
            <div
              key={entry.id}
              className="flex items-baseline justify-between gap-2"
            >
              <p className="text-sm font-medium">
                {entry.credential || 'Credential'}
                {entry.institution ? ` · ${entry.institution}` : ''}
              </p>
              <p className="shrink-0 text-xs text-slate-500">
                {formatDateRange(
                  entry.startDate,
                  entry.endDate,
                  entry.isCurrent,
                )}
              </p>
            </div>
          ))}
        </section>
      )}

      {resume.skills.length > 0 && (
        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Skills
          </h2>
          {resume.skills.map((group) => (
            <p key={group.id} className="text-sm">
              <span className="font-medium">
                {group.category || 'Category'}:
              </span>{' '}
              {group.skills.filter(Boolean).join(', ')}
            </p>
          ))}
        </section>
      )}

      {resume.certifications.length > 0 && (
        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Certifications
          </h2>
          {resume.certifications.map((entry) => (
            <p key={entry.id} className="text-sm">
              {entry.name || 'Certification'}
              {entry.issuer ? ` · ${entry.issuer}` : ''}
              {entry.issueDate ? ` · ${entry.issueDate}` : ''}
            </p>
          ))}
        </section>
      )}

      {resume.projects.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Projects
          </h2>
          {resume.projects.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-1">
              <p className="text-sm font-medium">{entry.name || 'Project'}</p>
              {entry.description && (
                <p className="text-sm">{entry.description}</p>
              )}
            </div>
          ))}
        </section>
      )}
    </article>
  );
}
