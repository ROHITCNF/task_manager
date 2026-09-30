/**
 * Visual parity helpers (docs/lld/testing.md §4).
 * Screens are compared against docs/design/reference/*.png in code (pixelmatch), so a failing run
 * can never overwrite a reference. Actual and diff images go to test-results/visual/.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = join(root, 'test-results/visual');

export const FIXED_NOW = new Date('2026-09-30T04:00:00Z'); // 09:30 in Asia/Kolkata → "Good morning"

export function readReference(name) {
  return PNG.sync.read(readFileSync(join(root, 'docs/design/reference', name)));
}

/** Viewport (CSS px) that reproduces a reference captured at the given device scale factor. */
export function referenceViewport(name, scale) {
  const { width, height } = readReference(name);
  return { width: Math.round(width / scale), height: Math.round(height / scale) };
}

/**
 * Signs in through the mock API. The MSW worker must be running (any app page loaded first).
 * @param {import('@playwright/test').Page} page
 */
export async function mockSignIn(page) {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Continue with Google' }).waitFor(); // app booted, MSW running
  await page.evaluate(() => fetch('/api/v1/auth/mock-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }));
}

/** Waits for fonts and images so the screenshot is stable. */
export async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((r) => { img.onload = r; img.onerror = r; }))));
  });
}

/**
 * Screenshot vs reference. Returns the fraction of differing pixels and writes actual/diff PNGs.
 * @param {import('@playwright/test').Page} page
 * @param {string} name reference file name
 * @param {{ mask?: import('@playwright/test').Locator[], region?: { x: number, y: number, width: number, height: number }, scale?: number, label?: string }} [opts]
 *   region: compare only this rectangle (CSS px); scale: device scale factor of the reference;
 *   cropReference: false when the reference file is already a crop of that region.
 */
export async function diffAgainstReference(page, name, { mask = [], region, scale = 2, label, cropReference = true } = {}) {
  await settle(page);
  let reference = readReference(name);
  let actual = PNG.sync.read(await page.screenshot({ animations: 'disabled', caret: 'hide', mask, maskColor: '#ffffff' }));
  if (region) {
    const px = { x: Math.round(region.x * scale), y: Math.round(region.y * scale), width: Math.round(region.width * scale), height: Math.round(region.height * scale) };
    if (cropReference) reference = crop(reference, px);
    actual = crop(actual, px);
  }
  if (actual.width !== reference.width || actual.height !== reference.height) {
    throw new Error(`Size mismatch for ${name}: actual ${actual.width}x${actual.height}, reference ${reference.width}x${reference.height}`);
  }
  const { width, height } = reference;
  const diff = new PNG({ width, height });
  const differing = pixelmatch(reference.data, actual.data, diff.data, width, height, { threshold: 0.1 });

  mkdirSync(outDir, { recursive: true });
  const base = label ?? name.replace(/\.png$/, '');
  writeFileSync(join(outDir, `${base}.actual.png`), PNG.sync.write(actual));
  writeFileSync(join(outDir, `${base}.diff.png`), PNG.sync.write(diff));

  return differing / (width * height);
}

function crop(png, { x, y, width, height }) {
  const out = new PNG({ width, height });
  PNG.bitblt(png, out, x, y, width, height, 0, 0);
  return out;
}
