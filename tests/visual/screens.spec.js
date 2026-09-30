import { expect, test } from '@playwright/test';
import { FIXED_NOW, diffAgainstReference, mockSignIn, referenceViewport } from './reference.js';

// Remaining screens (US-06..US-11). Calendar is compared with the approved grid deviation (gap C1).
const SCREENS = [
  ['US-06', 'calendar_light.png', '/calendar', 'September 2026'],
  ['US-07', 'clients_light.png', '/clients', 'Jupiter Wagon Limited'],
  ['US-08', 'quick-capture_light.png', '/quick-capture', 'Split into tasks'],
  ['US-09..11', 'settings_light.png', '/settings', 'Pradeep Chandran'],
];

for (const [story, ref, path, marker] of SCREENS) {
  test(`${story} ${path} vs ${ref}`, async ({ page }) => {
    await page.setViewportSize(referenceViewport(ref, 2));
    await page.clock.setFixedTime(FIXED_NOW);
    await mockSignIn(page);
    await page.goto(path);
    await expect(page.getByText(marker).first()).toBeVisible();

    const ratio = await diffAgainstReference(page, ref);
    console.log(`${ref} diff ratio: ${(ratio * 100).toFixed(3)}%`);
    expect(ratio).toBeLessThan(0.02);
  });
}
