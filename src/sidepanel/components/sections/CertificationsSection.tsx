import type { ReactElement } from 'react';

import type { CertificationEntry } from '../../../lib/resume';
import { createBlankCertificationEntry } from '../../../lib/resume';
import { RepeatingSection } from '../RepeatingSection';
import { TextField } from '../ui/TextField';

interface CertificationsSectionProps {
  entries: CertificationEntry[];
  onChange: (entries: CertificationEntry[]) => void;
}

export function CertificationsSection({
  entries,
  onChange,
}: CertificationsSectionProps): ReactElement {
  return (
    <RepeatingSection
      title="Certifications"
      items={entries}
      onChange={onChange}
      createItem={createBlankCertificationEntry}
      getKey={(entry) => entry.id}
      addLabel="+ Add certification"
      renderItem={(entry, onEntryChange) => (
        <>
          <div className="flex gap-3">
            <TextField
              label="Name"
              required
              value={entry.name}
              onChange={(name) => {
                onEntryChange({ ...entry, name });
              }}
            />
            <TextField
              label="Issuer"
              required
              value={entry.issuer}
              onChange={(issuer) => {
                onEntryChange({ ...entry, issuer });
              }}
            />
          </div>
          <div className="flex gap-3">
            <TextField
              label="Issued"
              type="month"
              value={entry.issueDate ?? ''}
              onChange={(issueDate) => {
                onEntryChange({ ...entry, issueDate: issueDate || undefined });
              }}
            />
            <TextField
              label="Expires"
              type="month"
              value={entry.expirationDate ?? ''}
              onChange={(expirationDate) => {
                onEntryChange({
                  ...entry,
                  expirationDate: expirationDate || undefined,
                });
              }}
            />
          </div>
          <TextField
            label="Credential URL"
            type="url"
            value={entry.credentialUrl ?? ''}
            onChange={(credentialUrl) => {
              onEntryChange({
                ...entry,
                credentialUrl: credentialUrl || undefined,
              });
            }}
          />
        </>
      )}
    />
  );
}
