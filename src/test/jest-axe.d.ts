import 'vitest';

declare module 'vitest' {
  interface Assertion<R = void> {
    toHaveNoViolations(): R;
  }
}
