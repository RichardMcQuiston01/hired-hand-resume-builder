import { defineManifest } from '@crxjs/vite-plugin';

import packageJson from './package.json' with { type: 'json' };

const { version } = packageJson;

export default defineManifest({
  manifest_version: 3,
  name: 'Hired Hand: Resume Builder',
  description:
    'Build and export ATS-compatible resumes. Part of the Hired Hand family of Chrome extensions.',
  version,
  action: {},
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  permissions: ['storage', 'sidePanel'],
});
