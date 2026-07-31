import { expect, test } from '@playwright/test';
import { FREE_COURSE_SLUG } from './global-setup';
import { registerUser } from './helpers';

test('marking lessons complete updates the progress bar and persists across reload', async ({
  page,
}) => {
  await registerUser(page);

  await page.goto(`/courses/${FREE_COURSE_SLUG}`);
  await page.getByRole('button', { name: 'Enroll for free' }).click();
  await expect(page).toHaveURL(new RegExp(`/courses/${FREE_COURSE_SLUG}/learn`));

  await expect(page.getByText('0% complete')).toBeVisible();

  await page.getByRole('button', { name: 'Mark as complete' }).click();
  await expect(page.getByText('50% complete')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Completed' })).toBeVisible();

  await page.getByRole('button', { name: /2\. Lesson 2: Next steps/ }).click();
  await page.getByRole('button', { name: 'Mark as complete' }).click();
  await expect(page.getByText('100% complete')).toBeVisible();

  await page.reload();
  await expect(page.getByText('100% complete')).toBeVisible();
});
