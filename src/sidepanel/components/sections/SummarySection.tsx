import type { ReactElement } from 'react';

import { TextAreaField } from '../ui/TextAreaField';

interface SummarySectionProps {
  summary: string | undefined;
  onChange: (summary: string | undefined) => void;
}

export function SummarySection({
  summary,
  onChange,
}: SummarySectionProps): ReactElement {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-slate-900">Summary</h2>
      <TextAreaField
        label="Professional summary"
        value={summary ?? ''}
        placeholder="A short pitch highlighting your experience and goals."
        onChange={(value) => {
          onChange(value || undefined);
        }}
      />
    </section>
  );
}
