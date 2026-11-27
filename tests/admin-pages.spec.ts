import { test, expect } from './auth-utils';

test.slow();
test('test access to admin page', async ({ getUserPage }) => {
  const adminPage = await getUserPage('admin@foo.com', 'changeme');

  // Navigate to the home page and verify signed-in state
  await adminPage.goto('http://localhost:3000/');
  await expect(
    adminPage.getByRole('button', { name: 'admin@foo.com' })
  ).toBeVisible({ timeout: 10000 });

  // Verify updated Navbar links
  await expect(
    adminPage.getByRole('link', { name: /manoa-bathroom-finder/i })
  ).toBeVisible({ timeout: 5000 });
  await expect(
    adminPage.getByRole('link', { name: 'Restroom Directory' })
  ).toBeVisible({ timeout: 5000 });
  await expect(
    adminPage.getByRole('link', { name: 'Interactive Map' })
  ).toBeVisible({ timeout: 5000 });
  await expect(
    adminPage.getByRole('link', { name: 'My Dashboard' })
  ).toBeVisible({ timeout: 5000 });
  await expect(
    adminPage.getByRole('link', { name: /Admin Queue/i })
  ).toBeVisible({ timeout: 5000 });

  // Navigate to Admin Queue and verify Admin Console renders
  await adminPage.getByRole('link', { name: /Admin Queue/i }).click();
  await expect(
    adminPage.getByRole('heading', { name: 'Site Administration Console' })
  ).toBeVisible({ timeout: 5000 });
  await expect(
    adminPage.getByRole('heading', { name: 'Review Moderation Queue' })
  ).toBeVisible({ timeout: 5000 });
  await expect(
    adminPage.getByRole('button', { name: 'Add New Restroom' })
  ).toBeVisible({ timeout: 5000 });
});