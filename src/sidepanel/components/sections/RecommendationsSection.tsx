import type { ReactElement } from 'react';

import type {
  Recommendation,
  RecommendationRelationship,
} from '@hired-hand/resume-core';
import { createBlankRecommendation } from '@hired-hand/resume-core';
import { RepeatingSection } from '../RepeatingSection';
import { CheckboxField } from '../ui/CheckboxField';
import { SelectField, type SelectOption } from '../ui/SelectField';
import { TextAreaField } from '../ui/TextAreaField';
import { TextField } from '../ui/TextField';

const RELATIONSHIP_LABELS: Record<RecommendationRelationship, string> = {
  manager: 'Manager',
  peer: 'Colleague / peer',
  direct_report: 'Direct report',
  client: 'Client',
  mentor: 'Mentor',
  professor: 'Professor',
  other: 'Other',
};

const RELATIONSHIP_OPTIONS: SelectOption[] = Object.entries(
  RELATIONSHIP_LABELS,
).map(([value, label]) => ({ value, label }));

function isRelationship(value: string): value is RecommendationRelationship {
  return value in RELATIONSHIP_LABELS;
}

interface RecommendationsSectionProps {
  entries: Recommendation[];
  onChange: (entries: Recommendation[]) => void;
}

export function RecommendationsSection({
  entries,
  onChange,
}: RecommendationsSectionProps): ReactElement {
  return (
    <RepeatingSection
      title="Recommendations"
      items={entries}
      onChange={onChange}
      createItem={createBlankRecommendation}
      getKey={(entry) => entry.id}
      addLabel="Add recommendation"
      renderItem={(entry, onEntryChange) => (
        <>
          <TextField
            label="Author name"
            required
            value={entry.authorName}
            onChange={(authorName) => {
              onEntryChange({ ...entry, authorName });
            }}
          />
          <div className="flex gap-3">
            <TextField
              label="Author title"
              value={entry.authorTitle ?? ''}
              onChange={(authorTitle) => {
                onEntryChange({
                  ...entry,
                  authorTitle: authorTitle || undefined,
                });
              }}
            />
            <TextField
              label="Author company"
              value={entry.authorCompany ?? ''}
              onChange={(authorCompany) => {
                onEntryChange({
                  ...entry,
                  authorCompany: authorCompany || undefined,
                });
              }}
            />
          </div>
          <SelectField
            label="Relationship"
            value={entry.relationship}
            options={RELATIONSHIP_OPTIONS}
            onChange={(value) => {
              if (isRelationship(value)) {
                onEntryChange({ ...entry, relationship: value });
              }
            }}
          />
          <TextAreaField
            label="Recommendation"
            rows={4}
            placeholder="What they said about working with you."
            value={entry.quote}
            onChange={(quote) => {
              onEntryChange({ ...entry, quote });
            }}
          />
          <TextField
            label="Source URL"
            type="url"
            placeholder="Link to the original, e.g. a LinkedIn recommendation"
            value={entry.sourceUrl ?? ''}
            onChange={(sourceUrl) => {
              onEntryChange({ ...entry, sourceUrl: sourceUrl || undefined });
            }}
          />
          <CheckboxField
            label="This person agreed to have their name and words published"
            checked={entry.hasAuthorPermission}
            onChange={(hasAuthorPermission) => {
              onEntryChange({ ...entry, hasAuthorPermission });
            }}
          />
          {!entry.hasAuthorPermission && (
            <p className="text-xs text-ink-600">
              Recommendations without permission are left out of the portfolio
              export.
            </p>
          )}
        </>
      )}
    />
  );
}
