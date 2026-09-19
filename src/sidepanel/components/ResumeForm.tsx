import type { ReactElement } from 'react';

import type { Resume } from '../../lib/resume';
import { CertificationsSection } from './sections/CertificationsSection';
import { ContactSection } from './sections/ContactSection';
import { EducationSection } from './sections/EducationSection';
import { ExperienceSection } from './sections/ExperienceSection';
import { ProjectsSection } from './sections/ProjectsSection';
import { SkillsSection } from './sections/SkillsSection';
import { SummarySection } from './sections/SummarySection';

interface ResumeFormProps {
  resume: Resume;
  onChange: (updater: (resume: Resume) => Resume) => void;
}

export function ResumeForm({
  resume,
  onChange,
}: ResumeFormProps): ReactElement {
  return (
    <div className="flex flex-col gap-6 p-4">
      <ContactSection
        contact={resume.contact}
        onChange={(contact) => {
          onChange((prev) => ({ ...prev, contact }));
        }}
      />
      <SummarySection
        summary={resume.summary}
        onChange={(summary) => {
          onChange((prev) => ({ ...prev, summary }));
        }}
      />
      <ExperienceSection
        entries={resume.experience}
        onChange={(experience) => {
          onChange((prev) => ({ ...prev, experience }));
        }}
      />
      <EducationSection
        entries={resume.education}
        onChange={(education) => {
          onChange((prev) => ({ ...prev, education }));
        }}
      />
      <SkillsSection
        groups={resume.skills}
        onChange={(skills) => {
          onChange((prev) => ({ ...prev, skills }));
        }}
      />
      <CertificationsSection
        entries={resume.certifications}
        onChange={(certifications) => {
          onChange((prev) => ({ ...prev, certifications }));
        }}
      />
      <ProjectsSection
        entries={resume.projects}
        onChange={(projects) => {
          onChange((prev) => ({ ...prev, projects }));
        }}
      />
    </div>
  );
}
