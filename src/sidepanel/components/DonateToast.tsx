import type { ReactElement } from 'react';

import { CloseIcon, HeartIcon } from './icons';

const DONATE_URL = 'https://donate.stripe.com/00w5kD3Gj1Xo9v7gVOcs800';

interface DonateToastProps {
  onClose: () => void;
}

export function DonateToast({ onClose }: DonateToastProps): ReactElement {
  return (
    <div
      role="status"
      className="flex items-center gap-3 border-t border-brand-700 bg-brand-900 px-4 py-3 text-white shadow-[0_-4px_16px_rgba(0,0,0,0.15)]"
    >
      <HeartIcon className="h-5 w-5 shrink-0 text-accent-600" />
      <p className="min-w-0 flex-1 text-sm text-brand-100">
        Enjoying Hired Hand? Support development with a coffee.
      </p>
      <a
        href={DONATE_URL}
        target="_blank"
        rel="noreferrer"
        className="shrink-0 rounded bg-accent-600 px-3 py-1 text-sm font-medium text-on-accent hover:bg-accent-700"
      >
        Donate
      </a>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        title="Dismiss"
        className="shrink-0 rounded p-1 text-brand-100 hover:bg-brand-700 hover:text-white"
      >
        <CloseIcon />
      </button>
    </div>
  );
}
