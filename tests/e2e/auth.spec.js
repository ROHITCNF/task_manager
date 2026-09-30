import { expect, test } from '@playwright/test';

// US-01 acceptance criteria 1, 4, 5, 6 (docs/requirements/user-stories.md).
test('sign in with the mock Google flow, stay signed in on reload, /login bounces home', async ({ page }) => {
  await page.goto('/tasks');
  await expect(page).toHaveURL(/\/login$/);

  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.reload();
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/login');
  await expect(page).toHaveURL(/\/$/);
});
