import { expect, test } from '@playwright/test';
import { FIXED_NOW, diffAgainstReference, mockSignIn, referenceViewport } from './reference.js';

// US-02 AC8: the sidebar region matches every app reference, with the right active item.
const SCREENS = [
  ['home_light.png', '/'],
  ['taskboard_light.png', '/tasks'],
  ['calendar_light.png', '/calendar'],
  ['clients_light.png', '/clients'],
  ['quick-capture_light.png', '/quick-capture'],
  ['settings_light.png', '/settings'],
];

for (const [ref, path] of SCREENS) {
  test(`US-02 sidebar matches ${ref}`, async ({ page }) => {
    const viewport = referenceViewport(ref, 2);
    await page.setViewportSize(viewport);
    await page.clock.setFixedTime(FIXED_NOW);
    await mockSignIn(page);
    await page.goto(path);
    await expect(page.getByRole('button', { name: 'Workspace DMT' })).toBeVisible();

    const ratio = await diffAgainstReference(page, ref, {
      region: { x: 0, y: 0, width: 217, height: viewport.height },
      label: `sidebar-${ref.replace('_light.png', '')}`,
    });
    console.log(`sidebar ${ref} diff ratio: ${(ratio * 100).toFixed(3)}%`);
    expect(ratio).toBeLessThan(0.02);
  });
}
