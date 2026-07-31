import { expect, test } from '@playwright/test';
import { loginUser, registerUser } from './helpers';

test.describe('registration and login', () => {
  test('a new user can register and lands on the catalog, signed in', async ({ page }) => {
    await registerUser(page);

    await expect(page.getByRole('heading', { name: 'Explore courses' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });

  test('a registered user can sign out and log back in with the same credentials', async ({
    page,
  }) => {
    const { email, password } = await registerUser(page);

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();

    await loginUser(page, email, password);
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });

  test('logging in with the wrong password is rejected', async ({ page }) => {
    const { email } = await registerUser(page);
    await page.getByRole('button', { name: 'Sign out' }).click();

    await page.goto('/login');
    await page.locator('input[type=email]').fill(email);
    await page.locator('input[type=password]').fill('wrong-password');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
