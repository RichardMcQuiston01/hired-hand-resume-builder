import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, expect, test } from '@playwright/test';
import type { BrowserContext } from '@playwright/test';

// Cross-browser/Chromium smoke test (ROADMAP.md Stage 7): loads the real
// `dist/` build as an unpacked MV3 extension in real Chromium and drives
// the side panel through `chrome-extension://<id>/src/sidepanel/index.html`
// directly — Playwright has no API to click a toolbar icon and open the
// side panel UI, but navigating straight to its built HTML entry exercises
// the exact same bundle, with real `chrome.*` APIs available, that the
// side panel would render.
const dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = path.resolve(dirname, '..', 'dist');
const SCREENSHOT_PATH = path.resolve(
  dirname,
  '..',
  'store-assets/screenshots/side-panel.png',
);

// Chrome's side panel is a narrow, tall, user-resizable pane (roughly
// 320-400px wide) — not a normal browser tab. Using that shape here (rather
// than Playwright's 1280x720 tab default) is what caught a real bug: two-up
// field rows (Company/Title, Start/End date) overflowed it horizontally
// before TextField grew a `min-w-0`.
const SIDE_PANEL_VIEWPORT = { width: 380, height: 1800 };

let context: BrowserContext;
let sidePanelUrl: string;

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext('', {
    headless: true,
    // Lets environments with a pre-provisioned Chromium build (whose
    // revision may not match this project's pinned @playwright/test
    // version) point at it instead of Playwright's own downloaded browser.
    // Unset in CI, where `playwright install` provides a matching build.
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
    ],
  });

  let [serviceWorker] = context.serviceWorkers();
  serviceWorker ??= await context.waitForEvent('serviceworker');
  const extensionId = serviceWorker.url().split('/')[2];
  sidePanelUrl = `chrome-extension://${extensionId}/src/sidepanel/index.html`;
});

test.afterAll(async () => {
  await context.close();
});

test('the resume builder loads and is usable at real side-panel width', async () => {
  const page = await context.newPage();
  await page.setViewportSize(SIDE_PANEL_VIEWPORT);
  await page.goto(sidePanelUrl);

  await expect(
    page.getByRole('heading', { name: 'Hired Hand: Resume Builder' }),
  ).toBeVisible();

  await page.getByLabel(/full name/i).fill('Jordan Rivera');
  await expect(
    page.getByRole('heading', { name: 'Jordan Rivera', level: 1 }),
  ).toBeVisible();

  await page.getByRole('button', { name: '+ Add job' }).click();
  await page.getByLabel(/^company/i).fill('Acme Corp');
  await expect(page.getByText('Acme Corp')).toBeVisible();

  await page
    .getByLabel(/job description/i)
    .fill('Looking for someone with Acme experience.');
  await expect(page.getByText(/match score: /i)).toBeVisible();

  // Nothing should force the page wider than the side panel itself — a
  // two-up field row that doesn't shrink would push this past 0.
  const horizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBe(0);

  // Interacting with fields below the fold auto-scrolls the panel's
  // internal `overflow-y-auto` container to keep them in view; reset it so
  // the store screenshot starts from the top of the resume.
  await page.locator('main').evaluate((main: HTMLElement) => {
    main.scrollTop = 0;
  });
  await page.screenshot({ path: SCREENSHOT_PATH });
});

test('a TXT export triggers a real browser download', async () => {
  const page = await context.newPage();
  await page.goto(sidePanelUrl);

  await page.getByLabel(/full name/i).fill('Jordan Rivera');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'TXT' }).click(),
  ]);

  expect(download.suggestedFilename()).toMatch(/\.txt$/);
});
