import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test.beforeEach(async ({ page }) => {
	await page.goto('/');
});

const searchBox = (page: Page) => page.getByRole('textbox', { name: 'Search Google' });

test('focuses the search box on load', async ({ page }) => {
	await expect(searchBox(page)).toBeFocused();
});

test('searches Google with the typed query', async ({ page }) => {
	await searchBox(page).fill('cats & dogs');
	await searchBox(page).press('Enter');

	await expect(page).toHaveURL('https://www.google.com/search?q=cats%20%26%20dogs');
});

test.describe('calculator', () => {
	test('shows the answer for an expression starting with "="', async ({ page }) => {
		await searchBox(page).fill('=2+3*4');
		await expect(page.getByText('= 14')).toBeVisible();
		await expect(page.getByText('Press Enter to copy')).toBeVisible();
	});

	test('copies the answer on Enter instead of searching', async ({ page }) => {
		await searchBox(page).fill('=6*7');
		await searchBox(page).press('Enter');

		await expect(page.getByText('Copied to clipboard!')).toBeVisible();
		expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('42');
		await expect(page).toHaveURL('/');
	});

	test('hides the answer for an invalid expression', async ({ page }) => {
		await searchBox(page).fill('=2**3');
		await expect(page.getByText(/^= /)).toHaveCount(0);
	});

	test('does not run code typed into the box', async ({ page }) => {
		await searchBox(page).fill('=alert(1)');
		await expect(page.getByText(/^= /)).toHaveCount(0);
	});
});

test.describe('empty search', () => {
	test('shakes the box and nudges the user instead of searching', async ({ page }) => {
		await page.getByRole('button', { name: 'Search', exact: true }).click();

		await expect(page.locator('form.search-box.shake')).toBeVisible();
		await expect(page.locator('.empty-search-popup.show')).toBeVisible();
		await expect(page).toHaveURL('/');
	});

	test('treats whitespace as empty', async ({ page }) => {
		await searchBox(page).fill('   ');
		await searchBox(page).press('Enter');

		await expect(page.locator('.empty-search-popup.show')).toBeVisible();
		await expect(page).toHaveURL('/');
	});
});
