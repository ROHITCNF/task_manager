import { expect, test } from '@playwright/test';
import { FIXED_NOW, diffAgainstReference, mockSignIn, referenceViewport } from './reference.js';

// 1× captures. The board behind the scrim shows data from a later day than taskboard_light.png,
// so only the drawer region is compared.
const CASES = [
  ['US-14', 'card_click_state_light.png', 'Details'],
  ['US-15', 'card_click_state_history_light.png', 'History'],
];

for (const [story, ref, tab] of CASES) {
  test.describe(ref, () => {
    test.use({ deviceScaleFactor: 1, viewport: referenceViewport(ref, 1) });
    test(`${story} drawer (${tab}) vs ${ref}`, async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-09-30T08:45:00Z')); // 14:15 IST → "6d 18h"
      await mockSignIn(page);
      await page.goto('/tasks');
      await page.getByRole('article', { name: 'Re: Intellicar Track Platform cleanup' }).click();
      const drawer = page.getByRole('dialog');
      await expect(drawer.getByText('CSM - NIRANJAN BALAJI.')).toBeVisible();
      if (tab === 'History') {
        await drawer.getByRole('button', { name: 'History' }).click();
        await expect(drawer.getByText(/so far/)).toBeVisible();
      }
      const { width, height } = referenceViewport(ref, 1);
      const box = await drawer.boundingBox();
      const ratio = await diffAgainstReference(page, ref, {
        scale: 1, label: `drawer-${tab.toLowerCase()}`, region: { x: Math.floor(box.x), y: 0, width: width - Math.floor(box.x), height },
      });
      console.log(`${ref} (drawer region) diff ratio: ${(ratio * 100).toFixed(3)}%`);
      expect(ratio).toBeLessThan(0.02);
    });
  });
}

test.describe('card-hover_light.png', () => {
  test.use({ deviceScaleFactor: 1 });
  test('US-13 hover card region', async ({ page }) => {
    await page.setViewportSize({ width: 1896, height: 942 });
    await page.clock.setFixedTime(FIXED_NOW);
    await mockSignIn(page);
    await page.goto('/tasks');
    const card = page.getByRole('article', { name: 'Re: Intellicar Track Platform cleanup' });
    await card.hover();
    await expect(page.getByRole('combobox', { name: /Status of Re: Intellicar/ })).toBeVisible();
    // The crop is 332×222 around the card; align its top-left to the Backlog column's.
    const column = await page.getByRole('region', { name: 'Backlog' }).boundingBox();
    const ratio = await diffAgainstReference(page, 'card-hover_light.png', {
      scale: 1, label: 'card-hover', cropReference: false, region: { x: Math.round(column.x) - 26, y: Math.round(column.y) - 50, width: 332, height: 222 },
    });
    console.log(`card-hover_light.png diff ratio: ${(ratio * 100).toFixed(3)}%`);
    expect(ratio).toBeLessThan(0.02);
  });
});
