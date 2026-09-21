import type { ReactElement } from 'react';

export function PencilIcon(): ReactElement {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <path d="M17.414 2.586a2 2 0 0 0-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 0 0 0-2.828Z" />
      <path
        fillRule="evenodd"
        d="M2 6a2 2 0 0 1 2-2h4a1 1 0 1 1 0 2H4v10h10v-4a1 1 0 1 1 2 0v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
