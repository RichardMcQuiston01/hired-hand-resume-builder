import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { ChevronDownIcon } from './icons';

interface AccordionSectionProps {
  title: string;
  /** Defaults to expanded, since every section is core to using the tool. */
  defaultOpen?: boolean;
  /** Rendered on the right of the header row (e.g. an Import JSON button). */
  headerAction?: ReactNode;
  children: ReactNode;
}

/** A collapsible section of the main scroll view, with its title and an
 * optional header action always visible even when collapsed. */
export function AccordionSection({
  title,
  defaultOpen = true,
  headerAction,
  children,
}: AccordionSectionProps): ReactElement {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="border-t border-border-subtle">
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-0">
        <button
          type="button"
          onClick={() => {
            setIsOpen((open) => !open);
          }}
          aria-expanded={isOpen}
          className="flex items-center gap-1.5 text-base font-semibold text-ink-900"
        >
          <ChevronDownIcon
            className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`}
          />
          {title}
        </button>
        {headerAction}
      </div>
      {isOpen && <div className="flex flex-col gap-4 p-4">{children}</div>}
    </section>
  );
}
