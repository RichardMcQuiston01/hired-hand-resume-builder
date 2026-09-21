import type { ReactElement } from 'react';

import type { ExperienceEntry } from '../../../lib/resume';
import { createBlankExperienceEntry } from '../../../lib/resume';
import { RepeatingSection } from '../RepeatingSection';
import { CheckboxField } from '../ui/CheckboxField';
import { StringListField } from '../ui/StringListField';
import { TextField } from '../ui/TextField';

interface ExperienceSectionProps {
  entries: ExperienceEntry[];
  onChange: (entries: ExperienceEntry[]) => void;
}

export function ExperienceSection({
  entries,
  onChange,
}: ExperienceSectionProps): ReactElement {
  return (
    <RepeatingSection
      title="Experience"
      items={entries}
      onChange={onChange}
      createItem={createBlankExperienceEntry}
      getKey={(entry) => entry.id}
      addLabel="+ Add job"
      collapsible={{
        isComplete: (entry) =>
          Boolean(
            entry.company.trim() &&
            entry.title.trim() &&
            entry.startDate.trim(),
          ),
        renderSummary: (entry) => (
          <span>
            <span className="font-medium">{entry.title}</span>
            {entry.company && ` · ${entry.company}`}
          </span>
        ),
      }}
      renderItem={(entry, onEntryChange) => (
        <>
          <div className="flex gap-3">
            <TextField
              label="Company"
              required
              value={entry.company}
              onChange={(company) => {
                onEntryChange({ ...entry, company });
              }}
            />
            <TextField
              label="Title"
              required
              value={entry.title}
              onChange={(title) => {
                onEntryChange({ ...entry, title });
              }}
            />
          </div>
          <TextField
            label="Location"
            value={entry.location ?? ''}
            onChange={(location) => {
              onEntryChange({ ...entry, location: location || undefined });
            }}
          />
          <div className="flex gap-3">
            <TextField
              label="Start date"
              type="month"
              required
              value={entry.startDate}
              onChange={(startDate) => {
                onEntryChange({ ...entry, startDate });
              }}
            />
            <TextField
              label="End date"
              type="month"
              value={entry.endDate ?? ''}
              onChange={(endDate) => {
                onEntryChange({ ...entry, endDate: endDate || undefined });
              }}
            />
          </div>
          <CheckboxField
            label="I currently work here"
            checked={entry.isCurrent}
            onChange={(isCurrent) => {
              onEntryChange({
                ...entry,
                isCurrent,
                endDate: isCurrent ? undefined : entry.endDate,
              });
            }}
          />
          <StringListField
            label="Highlights"
            items={entry.highlights}
            placeholder="Describe an accomplishment..."
            onChange={(highlights) => {
              onEntryChange({ ...entry, highlights });
            }}
          />
        </>
      )}
    />
  );
}
