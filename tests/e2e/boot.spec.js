import { expect, test } from '@playwright/test';

// Phase 2 smoke test: the app boots in mock mode, MSW answers in the browser, and the auth guard redirects.
test('signed-out visit to /tasks is redirected to /login via the mocked session check', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  const session = page.waitForResponse((r) => r.url().endsWith('/api/v1/auth/session'));
  await page.goto('/tasks');
  expect((await session).status()).toBe(401);

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain('Geist');
  expect(errors.filter((e) => !e.includes('401'))).toEqual([]);
});
