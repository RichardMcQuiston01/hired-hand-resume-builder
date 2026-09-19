import type { ReactElement } from 'react';

export function App(): ReactElement {
  return (
    <main className="flex w-80 flex-col gap-2 p-4">
      <h1 className="text-lg font-semibold text-slate-900">
        Hired Hand: Resume Builder
      </h1>
      <p className="text-sm text-slate-600">
        Project scaffolding is in place. The resume builder UI lands in a later
        development stage — see ROADMAP.md.
      </p>
    </main>
  );
}
