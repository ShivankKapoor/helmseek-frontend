import type { Page } from '@playwright/test';
import { expect, test, TEST_USER } from './fixtures';

const accountButton = (page: Page) => page.getByRole('button', { name: 'Account' });

async function signInThroughTheUi(page: Page, username = TEST_USER.username, password = TEST_USER.password) {
	await accountButton(page).click();
	const dialog = page.getByRole('dialog', { name: 'Sign In' });
	await dialog.getByLabel('Username').fill(username);
	await dialog.getByLabel('Password', { exact: true }).fill(password);
	await dialog.getByRole('button', { name: 'Sign In', exact: true }).click();
	return dialog;
}

test.describe('signing in', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('opens the sign-in form from the account button', async ({ page }) => {
		await accountButton(page).click();
		const dialog = page.getByRole('dialog', { name: 'Sign In' });
		await expect(dialog).toBeVisible();
		await expect(dialog.getByRole('button', { name: 'Sign In', exact: true })).toBeDisabled();
	});

	test('can reveal the typed password', async ({ page }) => {
		await accountButton(page).click();
		const password = page.getByLabel('Password', { exact: true });
		await expect(password).toHaveAttribute('type', 'password');
		await page.getByRole('button', { name: 'Toggle password visibility' }).click();
		await expect(password).toHaveAttribute('type', 'text');
	});

	test('signs in with correct credentials and loads the saved config', async ({ page, api }) => {
		api.signedIn = false;
		const dialog = await signInThroughTheUi(page);

		await expect(dialog).toBeHidden();
		expect(api.requestsTo('POST', '/auth/login')[0].body).toEqual(TEST_USER);
		expect(api.requestsTo('GET', '/user/config').length).toBeGreaterThan(1);
	});

	test('shows an error and stays open for a wrong password', async ({ page }) => {
		const dialog = await signInThroughTheUi(page, TEST_USER.username, 'wrong');

		await expect(dialog.getByRole('alert')).toHaveText('Invalid username or password.');
		await expect(dialog).toBeVisible();
	});

	test('shows a generic message when the server rate-limits the login', async ({ page, api }) => {
		api.rateLimited = true;
		const dialog = await signInThroughTheUi(page);

		await expect(dialog.getByRole('alert')).toHaveText('Something went wrong. Please try again.');
	});

	test('lets the user correct a wrong password and try again', async ({ page }) => {
		const dialog = await signInThroughTheUi(page, TEST_USER.username, 'wrong');
		await expect(dialog.getByRole('alert')).toBeVisible();

		await dialog.getByLabel('Password', { exact: true }).fill(TEST_USER.password);
		await dialog.getByRole('button', { name: 'Sign In', exact: true }).click();
		await expect(dialog).toBeHidden();
	});

	test('closes on Escape and clears what was typed', async ({ page }) => {
		await accountButton(page).click();
		await page.getByLabel('Username').fill('half-typed');
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).toBeHidden();

		await accountButton(page).click();
		await expect(page.getByLabel('Username')).toHaveValue('');
	});
});

test.describe('with an existing session', () => {
	test('restores the server config on load', async ({ page, api }) => {
		api.startSignedIn({ themeMode: 'dark', heroGreetingName: 'Alex' });
		await page.goto('/');

		await expect(page.locator('body')).toHaveClass(/dark/);
		await expect(page.getByText('Alex', { exact: true })).toBeVisible();
	});

	test('shows the account modal with the username', async ({ page, api }) => {
		api.startSignedIn();
		await page.goto('/');
		await accountButton(page).click();

		const dialog = page.getByRole('dialog', { name: 'Account Info' });
		await expect(dialog.getByText(TEST_USER.username)).toBeVisible();
	});

	test('shows the account sections in settings', async ({ page, api }) => {
		api.startSignedIn();
		await page.goto('/');
		await page.getByRole('button', { name: 'Settings' }).click();

		const dialog = page.getByRole('dialog', { name: 'Settings' });
		for (const section of ['Quote of the Day', 'Configuration Sync', 'Account']) {
			await expect(dialog.getByText(section, { exact: true })).toBeVisible();
		}
	});

	test('saves setting changes to the server', async ({ page, api }) => {
		api.startSignedIn();
		await page.goto('/');
		await page.getByRole('button', { name: 'Settings' }).click();
		await page.getByRole('button', { name: /Light Mode/ }).click();

		await expect.poll(() => api.lastSavedConfig()?.themeMode).toBe('dark');
	});

	test('saves quick links as a JSON string, as the backend expects', async ({ page, api }) => {
		api.startSignedIn();
		await page.goto('/');
		await page.getByRole('button', { name: 'Settings' }).click();
		const dialog = page.getByRole('dialog', { name: 'Settings' });
		await dialog.getByLabel('Enable Quick Links').check();
		await dialog.getByRole('button', { name: /Add Quick Link/ }).click();
		const form = page.getByRole('dialog', { name: 'Add Quick Link' });
		await form.getByLabel('Link Text').fill('Docs');
		await form.getByLabel('URL').fill('https://docs.example.com');
		await form.getByRole('button', { name: 'Add', exact: true }).click();

		await expect.poll(() => api.lastSavedConfig()?.quickLinks[0]?.text).toBe('Docs');
		const raw = api.requestsTo('POST', '/user/config').at(-1)!.body as { quickLinks: unknown };
		expect(typeof raw.quickLinks).toBe('string');
	});

	test('syncs the config down from the server on request', async ({ page, api }) => {
		api.startSignedIn({ heroGreetingName: 'FromServer' });
		await page.goto('/');
		await accountButton(page).click();
		await page.getByRole('button', { name: 'Sync from Server' }).click();

		await expect(page.getByText('Configuration synced from server successfully!')).toBeVisible();
	});

	test('syncs the config up to the server on request', async ({ page, api }) => {
		api.startSignedIn();
		await page.goto('/');
		await accountButton(page).click();
		await page.getByRole('button', { name: 'Sync to Server' }).click();

		await expect(page.getByText('Configuration synced to server successfully!')).toBeVisible();
		expect(api.requestsTo('POST', '/user/config')).toHaveLength(1);
	});
});

test.describe('signing out', () => {
	test('from the account modal', async ({ page, api }) => {
		api.startSignedIn();
		await page.goto('/');
		await accountButton(page).click();
		await page.getByRole('button', { name: 'Logout' }).click();

		await expect(page.getByRole('dialog')).toBeHidden();
		expect(api.requestsTo('POST', '/auth/logout')).toHaveLength(1);

		await accountButton(page).click();
		await expect(page.getByRole('dialog', { name: 'Sign In' })).toBeVisible();
	});

	test('from settings', async ({ page, api }) => {
		api.startSignedIn();
		await page.goto('/');
		await page.getByRole('button', { name: 'Settings' }).click();
		await page.getByRole('button', { name: 'Sign Out' }).click();

		await expect(page.getByRole('dialog')).toBeHidden();
		expect(api.requestsTo('POST', '/auth/logout')).toHaveLength(1);
	});

	test('goes back to the local config, not the account config', async ({ page, api }) => {
		api.startSignedIn({ heroGreetingName: 'AccountName' });
		await page.goto('/');
		await expect(page.getByText('AccountName', { exact: true })).toBeVisible();

		await accountButton(page).click();
		await page.getByRole('button', { name: 'Logout' }).click();
		await expect(page.getByText('AccountName', { exact: true })).toHaveCount(0);
	});
});

test.describe('session expiry', () => {
	test('tells a signed-in user to sign in again and falls back to signed out', async ({ page, api }) => {
		await page.goto('/');
		await signInThroughTheUi(page);
		await expect(page.getByRole('dialog')).toBeHidden();

		api.expireSession();
		await page.getByRole('button', { name: 'Settings' }).click();
		await page.getByRole('button', { name: /Light Mode/ }).click();

		await expect(page.getByText('Session expired — please sign in again')).toBeVisible();
		await page.getByRole('button', { name: 'Close settings' }).click();
		await accountButton(page).click();
		await expect(page.getByRole('dialog', { name: 'Sign In' })).toBeVisible();
	});

	test('does not show an error to someone who was never signed in', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await expect(page.getByText('Session expired')).toHaveCount(0);
	});
});
