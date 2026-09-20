import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';
import { afterEach, expect } from 'vitest';

expect.extend(toHaveNoViolations);

// `globals: false` in vitest.config.ts means Testing Library's automatic
// cleanup (which detects a global `afterEach`) never registers, so each
// `render()` call would otherwise leak into the next test's DOM.
afterEach(() => {
  cleanup();
});
