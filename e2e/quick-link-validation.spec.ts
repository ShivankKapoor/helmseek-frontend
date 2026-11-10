import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

const SAVE_FAILED = "Couldn't save your changes to the server";

const openLinkForm = async (page: Page) => {
	await page.getByRole('button', { name: 'Settings' }).click();
	const settings = page.getByRole('dialog', { name: 'Settings' });
	if (!(await settings.getByLabel('Enable Quick Links').isChecked())) await settings.getByLabel('Enable Quick Links').check();
	await settings.getByRole('button', { name: /Add Quick Link/ }).click();
	return page.getByRole('dialog', { name: 'Add Quick Link' });
};

const fill = async (form: Locator, text: string, url: string) => {
	await form.getByLabel('Link Text').fill(text);
	await form.getByLabel('URL').fill(url);
	await form.getByLabel('URL').blur();
};

const addButton = (form: Locator) => form.getByRole('button', { name: 'Add', exact: true });

test.describe('the quick link form', () => {
	test('asks for a full address instead of accepting one that would fail to save', async ({ page }) => {
		await page.goto('/');
		const form = await openLinkForm(page);
		await fill(form, 'GitHub', 'github.com');

		await expect(form.getByText('Enter a full address starting with http:// or https://')).toBeVisible();
		await expect(addButton(form)).toBeDisabled();

		await form.getByLabel('URL').fill('https://github.com');
		await expect(form.getByText('Enter a full address')).toHaveCount(0);
		await expect(addButton(form)).toBeEnabled();
	});

	test('does not nag while the address is still being typed', async ({ page }) => {
		await page.goto('/');
		const form = await openLinkForm(page);
		await form.getByLabel('URL').pressSequentially('htt');

		await expect(form.getByText('Enter a full address')).toHaveCount(0);
		await expect(addButton(form)).toBeDisabled();
	});

	test('refuses addresses that are not http or https', async ({ page }) => {
		await page.goto('/');
		const form = await openLinkForm(page);
		for (const url of ['javascript:alert(1)', 'ftp://example.com', 'mailto:me@example.com', '//example.com']) {
			await fill(form, 'Link', url);
			await expect(addButton(form), url).toBeDisabled();
		}
	});

	test('tidies the address so the backend accepts it', async ({ page, api }) => {
		api.startSignedIn();
		await page.goto('/');
		const form = await openLinkForm(page);
		await fill(form, 'Docs', '  HTTPS://Docs.Example.com  ');
		await addButton(form).click();

		await expect.poll(() => api.lastSavedConfig()?.quickLinks[0]?.url).toBe('https://docs.example.com/');
		await expect(page.getByText(SAVE_FAILED)).toHaveCount(0);
	});

	test('a link that gets saved does not stop later settings from syncing', async ({ page, api }) => {
		api.startSignedIn();
		await page.goto('/');
		const form = await openLinkForm(page);
		await fill(form, 'GitHub', 'github.com'); // refused by the form, so it never reaches the server
		await expect(addButton(form)).toBeDisabled();
		await fill(form, 'GitHub', 'https://github.com');
		await addButton(form).click();

		await page.getByRole('button', { name: /Light Mode/ }).click();

		// The server accepted the link and the later theme change: nothing was refused along the way.
		await expect.poll(() => api.lastSavedConfig()?.themeMode).toBe('dark');
		expect(api.lastSavedConfig()?.quickLinks.map((link) => link.url)).toEqual(['https://github.com/']);
		await expect(page.getByText(SAVE_FAILED)).toHaveCount(0);
	});

	test('lets you repair a link that already has a bad address', async ({ page, api }) => {
		api.startSignedIn({
			quickLinksEnabled: true,
			quickLinks: [{ id: 'ql_1', enabled: true, text: 'Old', url: 'example.com', corner: 'top-left', order: 0 }]
		});
		await page.goto('/');
		await page.getByRole('button', { name: 'Settings' }).click();
		await page.getByRole('button', { name: 'Edit Old' }).click();

		const form = page.getByRole('dialog', { name: 'Edit Quick Link' });
		await form.getByLabel('URL').focus();
		await form.getByLabel('URL').blur();
		await expect(form.getByText('Enter a full address')).toBeVisible();
		await expect(form.getByRole('button', { name: 'Update' })).toBeDisabled();

		await form.getByLabel('URL').fill('https://example.com');
		await form.getByRole('button', { name: 'Update' }).click();
		await expect.poll(() => api.lastSavedConfig()?.quickLinks[0]?.url).toBe('https://example.com/');
	});
});

test.describe('when a save to the server fails', () => {
	test('tells you instead of failing silently', async ({ page, api }) => {
		api.startSignedIn();
		api.rejectSavesWith = 500;
		await page.goto('/');
		await page.getByRole('button', { name: 'Settings' }).click();
		await page.getByRole('button', { name: /Light Mode/ }).click();

		await expect(page.getByText(SAVE_FAILED)).toBeVisible();
	});

	test('shows one message even if several saves fail in a row', async ({ page, api }) => {
		api.startSignedIn();
		api.rejectSavesWith = 500;
		await page.goto('/');
		await page.getByRole('button', { name: 'Settings' }).click();
		await page.getByRole('button', { name: /Light Mode/ }).click();
		await page.getByRole('button', { name: /Dark Mode/ }).click();
		await page.getByRole('button', { name: /Light Mode/ }).click();

		await expect(page.getByText(SAVE_FAILED)).toHaveCount(1);
	});

	test('does not add a second message when the session has simply expired', async ({ page, api }) => {
		await page.goto('/');
		await page.getByRole('button', { name: 'Account' }).click();
		await page.getByLabel('Username').fill('test');
		await page.getByLabel('Password', { exact: true }).fill('test12345');
		await page.getByRole('button', { name: 'Sign In', exact: true }).click();
		await expect(page.getByRole('dialog')).toBeHidden();

		api.expireSession();
		await page.getByRole('button', { name: 'Settings' }).click();
		await page.getByRole('button', { name: /Light Mode/ }).click();

		await expect(page.getByText('Session expired — please sign in again')).toBeVisible();
		await expect(page.getByText(SAVE_FAILED)).toHaveCount(0);
	});
});
