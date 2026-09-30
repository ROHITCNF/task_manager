import { expect, test } from '@playwright/test';
import { FIXED_NOW, diffAgainstReference, mockSignIn, referenceViewport } from './reference.js';

const REF = 'taskboard_light.png';

test('US-04 board matches taskboard_light.png', async ({ page }) => {
  await page.setViewportSize(referenceViewport(REF, 2));
  await page.clock.setFixedTime(FIXED_NOW);
  await mockSignIn(page);
  await page.goto('/tasks');
  await expect(page.getByRole('article', { name: 'Curd operation on accounts, deals' })).toBeVisible();

  const ratio = await diffAgainstReference(page, REF);
  console.log(`${REF} diff ratio: ${(ratio * 100).toFixed(3)}%`);
  expect(ratio).toBeLessThan(0.02);
});
