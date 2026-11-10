import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

test.beforeEach(async ({ page }) => {
	await page.goto('/');
});

const openSettings = async (page: Page) => {
	await page.getByRole('button', { name: 'Settings' }).click();
	return page.getByRole('dialog', { name: 'Settings' });
};

test.describe('opening and closing', () => {
	test('closes with the close button', async ({ page }) => {
		const dialog = await openSettings(page);
		await expect(dialog).toBeVisible();
		await dialog.getByRole('button', { name: 'Close settings' }).click();
		await expect(dialog).toBeHidden();
	});

	test('closes with Escape', async ({ page }) => {
		const dialog = await openSettings(page);
		await page.keyboard.press('Escape');
		await expect(dialog).toBeHidden();
	});

	test('closes when the backdrop is clicked, but not the dialog', async ({ page }) => {
		const dialog = await openSettings(page);
		await dialog.getByRole('heading', { name: 'Settings' }).click();
		await expect(dialog).toBeVisible();

		await page.mouse.click(5, 5);
		await expect(dialog).toBeHidden();
	});

	test('opens from the right-click menu', async ({ page }) => {
		await page.mouse.click(400, 300, { button: 'right' });
		await page.getByRole('menuitem', { name: 'Settings' }).click();
		await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
	});

	test('does not show the account sections when signed out', async ({ page }) => {
		const dialog = await openSettings(page);
		for (const section of ['Quote of the Day', 'Configuration Sync', 'Account']) {
			await expect(dialog.getByText(section, { exact: true })).toHaveCount(0);
		}
	});
});

test.describe('appearance', () => {
	test('switches to dark mode and remembers it after a reload', async ({ page }) => {
		const dialog = await openSettings(page);
		await dialog.getByRole('button', { name: /Light Mode/ }).click();
		await expect(page.locator('body')).toHaveClass(/dark/);

		await page.reload();
		await expect(page.locator('body')).toHaveClass(/dark/);
	});

	test('applies the chosen color scheme', async ({ page }) => {
		const dialog = await openSettings(page);
		await dialog.getByRole('combobox', { name: 'Color scheme' }).selectOption({ label: 'Green' });

		await expect
			.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--button-bg')))
			.toBe('#34a853');
	});

	test('applies the chosen font and remembers it after a reload', async ({ page }) => {
		const dialog = await openSettings(page);
		await dialog.getByRole('button', { name: /Fira Code/ }).click();
		await dialog.getByRole('option', { name: 'Sora' }).click();

		await expect(dialog.getByRole('listbox')).toBeHidden();
		const fontVariable = () => page.evaluate(() => document.documentElement.style.getPropertyValue('--font-family'));
		await expect.poll(fontVariable).toContain('Sora');

		await page.reload();
		await expect.poll(fontVariable).toContain('Sora');
	});

	test('closes the font list when clicking elsewhere', async ({ page }) => {
		const dialog = await openSettings(page);
		await dialog.getByRole('button', { name: /Fira Code/ }).click();
		await expect(dialog.getByRole('listbox')).toBeVisible();

		await dialog.getByRole('heading', { name: 'Settings' }).click();
		await expect(dialog.getByRole('listbox')).toBeHidden();
	});
});

test.describe('hero widget', () => {
	test('offers clock options only for the clock modes', async ({ page }) => {
		const dialog = await openSettings(page);
		await expect(dialog.getByLabel('Clock Format')).toHaveCount(0);

		await dialog.getByLabel('Display Mode').selectOption('both');
		await expect(dialog.getByLabel('Clock Format')).toBeVisible();
		await expect(dialog.getByLabel('Custom Name (optional)')).toBeVisible();

		await dialog.getByLabel('Display Mode').selectOption('clock');
		await expect(dialog.getByLabel('Custom Name (optional)')).toHaveCount(0);
	});

	test('shows the custom name in the greeting', async ({ page }) => {
		const dialog = await openSettings(page);
		await dialog.getByLabel('Custom Name (optional)').fill('Alex');
		await dialog.getByLabel('Custom Name (optional)').blur();

		await expect(page.getByText('Alex', { exact: true })).toBeVisible();
	});

	test('can be hidden entirely', async ({ page }) => {
		const dialog = await openSettings(page);
		await expect(page.getByText(/^Good (Morning|Afternoon|Evening|Night)$/)).toBeVisible();

		await dialog.getByLabel('Enable Hero Widget').uncheck();
		await expect(page.getByText(/^Good (Morning|Afternoon|Evening|Night)$/)).toHaveCount(0);
	});
});

test.describe('weather widget', () => {
	test('looks up a ZIP code and shows the weather', async ({ page }) => {
		const dialog = await openSettings(page);
		await dialog.getByLabel('Enable Weather Widget').check();

		const save = dialog.getByRole('button', { name: 'Save Location' });
		await expect(save).toBeDisabled();
		await dialog.getByLabel('Zip Code').fill('78701');
		await save.click();

		await expect(dialog.getByText('Location set to Austin')).toBeVisible();
		await dialog.getByRole('button', { name: 'Close settings' }).click();
		await expect(page.getByText('72°F')).toBeVisible();
		await expect(page.getByText('Austin', { exact: true })).toBeVisible();
	});

	test('moves the widget to another corner', async ({ page }) => {
		const dialog = await openSettings(page);
		await dialog.getByLabel('Enable Weather Widget').check();
		await dialog.getByTitle('Bottom Left').click();

		await expect(dialog.getByTitle('Bottom Left')).toHaveAttribute('aria-pressed', 'true');
		await expect(dialog.getByTitle('Top Right')).toHaveAttribute('aria-pressed', 'false');
	});
});

test.describe('quick links', () => {
	const addLink = async (dialog: Locator, text: string, url: string, corner?: string) => {
		await dialog.getByRole('button', { name: /Add Quick Link/ }).click();
		const form = dialog.page().getByRole('dialog', { name: 'Add Quick Link' });
		await form.getByLabel('Link Text').fill(text);
		await form.getByLabel('URL').fill(url);
		if (corner) await form.getByTitle(corner).click();
		await form.getByRole('button', { name: 'Add', exact: true }).click();
	};

	test('adds a link and shows it on the page in the chosen corner', async ({ page }) => {
		const dialog = await openSettings(page);
		await dialog.getByLabel('Enable Quick Links').check();
		await expect(dialog.getByText('No quick links configured')).toBeVisible();

		await addLink(dialog, 'Docs', 'https://docs.example.com', 'Top Left');

		await dialog.getByRole('button', { name: 'Close settings' }).click();
		const link = page.getByRole('link', { name: 'Docs' });
		await expect(link).toHaveAttribute('href', 'https://docs.example.com');
		const box = (await link.boundingBox())!;
		expect(box.x).toBeLessThan(100);
		expect(box.y).toBeLessThan(100);
	});

	test('does not allow adding until both fields are filled', async ({ page }) => {
		const dialog = await openSettings(page);
		await dialog.getByLabel('Enable Quick Links').check();
		await dialog.getByRole('button', { name: /Add Quick Link/ }).click();

		const form = page.getByRole('dialog', { name: 'Add Quick Link' });
		await expect(form.getByRole('button', { name: 'Add', exact: true })).toBeDisabled();
		await form.getByLabel('Link Text').fill('Docs');
		await expect(form.getByRole('button', { name: 'Add', exact: true })).toBeDisabled();
		await form.getByLabel('URL').fill('https://docs.example.com');
		await expect(form.getByRole('button', { name: 'Add', exact: true })).toBeEnabled();
	});

	test('edits and deletes a link', async ({ page }) => {
		const dialog = await openSettings(page);
		await dialog.getByLabel('Enable Quick Links').check();
		await addLink(dialog, 'Docs', 'https://docs.example.com');

		await dialog.getByRole('button', { name: 'Edit Docs' }).click();
		const form = page.getByRole('dialog', { name: 'Edit Quick Link' });
		await expect(form.getByLabel('Link Text')).toHaveValue('Docs');
		await form.getByLabel('Link Text').fill('Handbook');
		await form.getByRole('button', { name: 'Update' }).click();
		await expect(dialog.getByText('Handbook')).toBeVisible();

		await dialog.getByRole('button', { name: 'Delete Handbook' }).click();
		await expect(dialog.getByText('Handbook')).toHaveCount(0);
		await expect(dialog.getByText('No quick links configured')).toBeVisible();
	});

	test('cancels without saving', async ({ page }) => {
		const dialog = await openSettings(page);
		await dialog.getByLabel('Enable Quick Links').check();
		await dialog.getByRole('button', { name: /Add Quick Link/ }).click();

		const form = page.getByRole('dialog', { name: 'Add Quick Link' });
		await form.getByLabel('Link Text').fill('Draft');
		await form.getByRole('button', { name: 'Cancel' }).click();

		await expect(form).toBeHidden();
		await expect(dialog.getByText('Draft')).toHaveCount(0);
	});

	test('keeps the links after a reload', async ({ page }) => {
		const dialog = await openSettings(page);
		await dialog.getByLabel('Enable Quick Links').check();
		await addLink(dialog, 'Docs', 'https://docs.example.com');

		await page.reload();
		await expect(page.getByRole('link', { name: 'Docs' })).toBeVisible();
	});
});
