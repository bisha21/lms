import { expect, test } from '@playwright/test';
import { FREE_COURSE_SLUG } from './global-setup';
import { registerUser } from './helpers';

test('a logged-in student can enroll in a free course and see it under My Courses', async ({
  page,
}) => {
  await registerUser(page);

  await page.goto(`/courses/${FREE_COURSE_SLUG}`);
  await expect(page.getByRole('heading', { name: 'E2E Free Intro Course' })).toBeVisible();

  await page.getByRole('button', { name: 'Enroll for free' }).click();
  await expect(page).toHaveURL(new RegExp(`/courses/${FREE_COURSE_SLUG}/learn`));

  await page.goto('/my-courses');
  await expect(page.getByRole('heading', { name: 'E2E Free Intro Course' })).toBeVisible();

  // Revisiting the course detail page now offers "Continue Learning" instead of enrolling again.
  await page.goto(`/courses/${FREE_COURSE_SLUG}`);
  await expect(page.getByRole('button', { name: 'Continue Learning' })).toBeVisible();
});
