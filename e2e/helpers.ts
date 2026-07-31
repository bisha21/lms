import { Page, expect } from '@playwright/test';

export async function registerUser(page: Page) {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const email = `e2e-${unique}@example.com`;
  const password = 'Password123!';
  const username = `e2e-user-${unique}`;

  await page.goto('/register');
  await page.locator('input[type=text]').fill(username);
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill(password);
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page).toHaveURL('/');

  return { email, password, username };
}

export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL('/');
}
