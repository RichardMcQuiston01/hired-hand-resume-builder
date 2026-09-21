import type { ReactElement } from 'react';

import type { EducationEntry } from '../../../lib/resume';
import { createBlankEducationEntry } from '../../../lib/resume';
import { RepeatingSection } from '../RepeatingSection';
import { CheckboxField } from '../ui/CheckboxField';
import { StringListField } from '../ui/StringListField';
import { TextField } from '../ui/TextField';

interface EducationSectionProps {
  entries: EducationEntry[];
  onChange: (entries: EducationEntry[]) => void;
}

export function EducationSection({
  entries,
  onChange,
}: EducationSectionProps): ReactElement {
  return (
    <RepeatingSection
      title="Education"
      items={entries}
      onChange={onChange}
      createItem={createBlankEducationEntry}
      getKey={(entry) => entry.id}
      addLabel="+ Add school"
      collapsible={{
        isComplete: (entry) =>
          Boolean(entry.institution.trim() && entry.credential.trim()),
        renderSummary: (entry) => (
          <span>
            <span className="font-medium">{entry.institution}</span>
            {entry.credential && ` · ${entry.credential}`}
          </span>
        ),
      }}
      renderItem={(entry, onEntryChange) => (
        <>
          <div className="flex gap-3">
            <TextField
              label="Institution"
              required
              value={entry.institution}
              onChange={(institution) => {
                onEntryChange({ ...entry, institution });
              }}
            />
            <TextField
              label="Credential"
              required
              placeholder="B.S. Computer Science"
              value={entry.credential}
              onChange={(credential) => {
                onEntryChange({ ...entry, credential });
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
              value={entry.startDate ?? ''}
              onChange={(startDate) => {
                onEntryChange({ ...entry, startDate: startDate || undefined });
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
            label="I'm currently enrolled here"
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
            placeholder="Honors, relevant coursework..."
            onChange={(highlights) => {
              onEntryChange({ ...entry, highlights });
            }}
          />
        </>
      )}
    />
  );
}
