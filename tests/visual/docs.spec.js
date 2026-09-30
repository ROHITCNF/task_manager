import { expect, test } from '@playwright/test';
import { FIXED_NOW, diffAgainstReference, mockSignIn, referenceViewport } from './reference.js';

const REF = 'docs_light.png';

// docs_light.png was captured at device scale factor 1.
test.use({ deviceScaleFactor: 1, viewport: referenceViewport(REF, 1) });

test('US-16 docs matches docs_light.png', async ({ page }) => {
  await page.clock.setFixedTime(FIXED_NOW);
  await mockSignIn(page);
  await page.goto('/docs');
  await expect(page.getByText('test5')).toBeVisible();
  const ratio = await diffAgainstReference(page, REF, { scale: 1 });
  console.log(`${REF} diff ratio: ${(ratio * 100).toFixed(3)}%`);
  expect(ratio).toBeLessThan(0.02);
});
