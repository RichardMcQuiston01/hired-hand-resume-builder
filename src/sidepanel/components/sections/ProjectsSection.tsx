import type { ReactElement } from 'react';

import type { ProjectEntry } from '../../../lib/resume';
import { createBlankProjectEntry } from '../../../lib/resume';
import { RepeatingSection } from '../RepeatingSection';
import { StringListField } from '../ui/StringListField';
import { TextAreaField } from '../ui/TextAreaField';
import { TextField } from '../ui/TextField';

interface ProjectsSectionProps {
  entries: ProjectEntry[];
  onChange: (entries: ProjectEntry[]) => void;
}

export function ProjectsSection({
  entries,
  onChange,
}: ProjectsSectionProps): ReactElement {
  return (
    <RepeatingSection
      title="Projects"
      items={entries}
      onChange={onChange}
      createItem={createBlankProjectEntry}
      getKey={(entry) => entry.id}
      addLabel="+ Add project"
      renderItem={(entry, onEntryChange) => (
        <>
          <TextField
            label="Name"
            required
            value={entry.name}
            onChange={(name) => {
              onEntryChange({ ...entry, name });
            }}
          />
          <TextAreaField
            label="Description"
            value={entry.description}
            onChange={(description) => {
              onEntryChange({ ...entry, description });
            }}
          />
          <TextField
            label="URL"
            type="url"
            value={entry.url ?? ''}
            onChange={(url) => {
              onEntryChange({ ...entry, url: url || undefined });
            }}
          />
          <StringListField
            label="Highlights"
            items={entry.highlights}
            onChange={(highlights) => {
              onEntryChange({ ...entry, highlights });
            }}
          />
        </>
      )}
    />
  );
}
