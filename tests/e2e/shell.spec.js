import { expect, test } from '@playwright/test';

async function signIn(page) {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page).toHaveURL(/\/$/);
}

// US-02 AC 3, 4, 5, 6.
test('nav routes and follows the active item; sign out returns to /login', async ({ page }) => {
  await signIn(page);
  const nav = page.getByRole('navigation', { name: 'Main' });

  for (const [label, path] of [['Inbox', '/inbox'], ['Tasks', '/tasks'], ['Calendar', '/calendar'], ['Docs', '/docs'],
    ['Clients', '/clients'], ['Quick Capture', '/quick-capture'], ['Settings', '/settings'], ['Home', '/']]) {
    await nav.getByRole('link', { name: label }).click();
    await expect(page).toHaveURL(new RegExp(`${path.replace('/', '\\/')}$`));
    await expect(nav.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page');
  }

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('theme preference persists across reloads', async ({ page }) => {
  await signIn(page);
  await page.getByRole('radio', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('html')).toHaveClass(/dark/);
});
