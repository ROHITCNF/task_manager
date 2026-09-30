import { expect, test } from '@playwright/test';
import { diffAgainstReference, referenceViewport } from './reference.js';

const REF = 'login_light.png';

// login_light.png was captured at device scale factor 1.
test.use({ deviceScaleFactor: 1, viewport: referenceViewport(REF, 1) });

test('US-01 login matches login_light.png', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  const ratio = await diffAgainstReference(page, REF);
  console.log(`${REF} diff ratio: ${(ratio * 100).toFixed(3)}%`);
  expect(ratio).toBeLessThan(0.02);
});
