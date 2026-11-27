import { test, expect } from './auth-utils';

test.slow();
test('can authenticate a specific user', async ({ getUserPage }) => {
  const customUserPage = await getUserPage('john@foo.com', 'changeme');

  // Navigate to the home page and verify signed-in state
  await customUserPage.goto('http://localhost:3000/');
  await expect(
    customUserPage.getByRole('button', { name: 'john@foo.com' })
  ).toBeVisible({ timeout: 10000 });

  // Verify updated Navbar links for a standard user
  await expect(
    customUserPage.getByRole('link', { name: /manoa-bathroom-finder/i })
  ).toBeVisible({ timeout: 5000 });
  await expect(
    customUserPage.getByRole('link', { name: 'Restroom Directory' })
  ).toBeVisible({ timeout: 5000 });
  await expect(
    customUserPage.getByRole('link', { name: 'Interactive Map' })
  ).toBeVisible({ timeout: 5000 });
  await expect(
    customUserPage.getByRole('link', { name: 'My Dashboard' })
  ).toBeVisible({ timeout: 5000 });
});