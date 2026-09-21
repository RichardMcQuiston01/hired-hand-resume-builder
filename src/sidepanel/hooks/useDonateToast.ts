import { useEffect, useState } from 'react';

const DONATE_TOAST_DISMISSED_KEY = 'hiredHand.donateToastDismissed.v1';

export interface UseDonateToastResult {
  /** False until the initial load from chrome.storage has settled, to
   * avoid a flash of the toast before a prior dismissal is known. */
  isLoaded: boolean;
  isVisible: boolean;
  dismiss: () => void;
}

/** Whether the user has already closed the donate toast, backed by
 * `chrome.storage.local` so the dismissal persists across sessions. */
export function useDonateToast(): UseDonateToastResult {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    chrome.storage.local
      .get(DONATE_TOAST_DISMISSED_KEY)
      .then((stored) => {
        if (!cancelled) {
          setIsDismissed(Boolean(stored[DONATE_TOAST_DISMISSED_KEY]));
          setIsLoaded(true);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to load donate toast state from storage.', error);
        if (!cancelled) {
          setIsLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function dismiss(): void {
    setIsDismissed(true);
    chrome.storage.local
      .set({ [DONATE_TOAST_DISMISSED_KEY]: true })
      .catch((error: unknown) => {
        console.error('Failed to save donate toast dismissal.', error);
      });
  }

  return { isLoaded, isVisible: isLoaded && !isDismissed, dismiss };
}
