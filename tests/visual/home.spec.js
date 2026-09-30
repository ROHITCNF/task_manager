import { expect, test } from '@playwright/test';
import { FIXED_NOW, diffAgainstReference, mockSignIn, referenceViewport } from './reference.js';

const REF = 'home_light.png';

test('US-03 home matches home_light.png', async ({ page }) => {
  await page.setViewportSize(referenceViewport(REF, 2));
  await page.clock.setFixedTime(FIXED_NOW);
  await mockSignIn(page);
  await page.goto('/');
  await expect(page.getByText('Plus 1 open task with nobody assigned.')).toBeVisible();

  const ratio = await diffAgainstReference(page, REF);
  console.log(`${REF} diff ratio: ${(ratio * 100).toFixed(3)}%`);
  expect(ratio).toBeLessThan(0.02);
});
