import { test } from '@playwright/test';
import { FIXED_NOW, mockSignIn } from '../visual/reference.js';
test('probe', async ({ page }) => {
  await page.setViewportSize({ width: 1717, height: 953 });
  await page.clock.setFixedTime(FIXED_NOW);
  await mockSignIn(page);
  await page.goto('/tasks');
  await page.getByRole('article').first().waitFor();
  const out = await page.evaluate(() => {
    const col = document.querySelector('section[aria-label="Backlog"]');
    const list = col.children[1];
    const cs = getComputedStyle(list);
    const arts = [...col.querySelectorAll('article')].slice(0, 2).map((a) => {
      const r = a.getBoundingClientRect(); const s = getComputedStyle(a);
      return { top: r.top, bottom: r.bottom, mt: s.marginTop, mb: s.marginBottom, display: s.display };
    });
    return { listDisplay: cs.display, gap: cs.rowGap, justify: cs.justifyContent, alignContent: cs.alignContent, listH: list.getBoundingClientRect().height, arts };
  });
  console.log(JSON.stringify(out));
});
