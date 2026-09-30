import { expect, test } from '@playwright/test';

async function signIn(page) {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page).toHaveURL(/\/$/);
}

// docs/lld/testing.md §5, flows 3–5.
test('board: search and client filter narrow cards and counts', async ({ page }) => {
  await signIn(page);
  await page.goto('/tasks');
  const backlog = page.getByRole('region', { name: 'Backlog' });
  await expect(backlog.getByRole('article')).toHaveCount(4);

  await page.getByRole('searchbox', { name: 'Search tasks' }).fill('callisto');
  await expect(backlog.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('region', { name: 'To do' }).getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('region', { name: 'To do' }).getByText('1', { exact: true })).toBeVisible();

  await page.getByRole('searchbox', { name: 'Search tasks' }).fill('');
  await page.getByRole('combobox', { name: 'Client' }).selectOption({ label: 'BGauss' });
  await expect(backlog.getByRole('article')).toHaveCount(1);
  await expect(backlog.getByRole('article')).toHaveAccessibleName('Bgauss_new vehicle_component FOTA');
});

test('calendar: next month and back with Today', async ({ page }) => {
  await signIn(page);
  await page.goto('/calendar');
  await expect(page.getByText('September 2026', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next month' }).click();
  await expect(page.getByText('October 2026', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Today' }).click();
  await expect(page.getByText('September 2026', { exact: true })).toBeVisible();
});

test('settings: create switches workspace, join adds without switching', async ({ page }) => {
  await signIn(page);
  await page.goto('/settings');
  await page.getByRole('textbox', { name: 'Workspace name' }).fill('Firmware team');
  await page.getByRole('button', { name: 'Create workspace' }).click();
  await expect(page.getByRole('button', { name: 'Workspace Firmware team' })).toBeVisible();

  await page.getByRole('textbox', { name: 'Invite code' }).fill('DEMO-123');
  await page.getByRole('button', { name: 'Join workspace' }).click();
  await expect(page.getByRole('textbox', { name: 'Invite code' })).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Workspace Firmware team' })).toBeVisible();
});
