import { expect, test } from '@playwright/test';

// US-13/14/15.
test('open a card, switch tabs, close back to the board', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await page.goto('/tasks');
  const card = page.getByRole('article', { name: 'Re: Intellicar Track Platform cleanup' });
  await card.hover();
  await expect(page.getByRole('combobox', { name: 'Status of Re: Intellicar Track Platform cleanup' })).toBeDisabled();

  await card.click();
  await expect(page).toHaveURL(/\/tasks\/tsk_/);
  const drawer = page.getByRole('dialog', { name: 'Re: Intellicar Track Platform cleanup' });
  await expect(drawer.getByText('CSM - NIRANJAN BALAJI.')).toBeVisible();
  await expect(drawer.getByRole('button', { name: /Rohit Srivastava/ })).toBeVisible();

  await drawer.getByRole('button', { name: 'History' }).click();
  await expect(drawer.getByText('added subtask “test 1”', { exact: false })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(drawer).toHaveCount(0);
});
