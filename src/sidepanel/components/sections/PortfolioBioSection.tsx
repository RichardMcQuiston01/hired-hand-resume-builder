import type { ReactElement } from 'react';

import { TextAreaField } from '../ui/TextAreaField';

interface PortfolioBioSectionProps {
  bio: string | undefined;
  onChange: (bio: string | undefined) => void;
}

export function PortfolioBioSection({
  bio,
  onChange,
}: PortfolioBioSectionProps): ReactElement {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-ink-900">About</h2>
      <TextAreaField
        label="Portfolio bio"
        rows={4}
        value={bio ?? ''}
        placeholder="A few sentences on your background, what you're building, and the kind of role you want next."
        onChange={(value) => {
          onChange(value || undefined);
        }}
      />
    </section>
  );
}
