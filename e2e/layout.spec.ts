import { expect, test } from './fixtures';

test.describe('on a phone-sized screen', () => {
	test.use({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true });

	test('fits the screen without sideways scrolling', async ({ page }) => {
		await page.goto('/');
		const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
		expect(overflow).toBeLessThanOrEqual(0);
	});

	test('uses the short footer', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByText('S. Kapoor')).toBeVisible();
		await expect(page.getByText('Shivank Kapoor')).toBeHidden();
	});

	test('keeps the search button inside the search box, whatever the font', async ({ page }) => {
		await page.goto('/');
		// Fonts are stubbed in tests, so force the condition that once broke this: an input whose
		// natural width is larger than the screen (Fira Code's is, on a 375px phone).
		await page.getByRole('textbox', { name: 'Search Google' }).evaluate((input: HTMLInputElement) => {
			input.size = 80;
		});

		const searchBox = (await page.locator('form.search-box').boundingBox())!;
		const button = (await page.getByRole('button', { name: 'Search', exact: true }).boundingBox())!;
		expect(button.x + button.width).toBeLessThanOrEqual(searchBox.x + searchBox.width + 0.5);
		expect(searchBox.x + searchBox.width).toBeLessThanOrEqual(375);
		// An overflowing page makes mobile Chrome widen the layout, which shrinks everything.
		expect(await page.evaluate(() => window.innerWidth)).toBe(375);
	});

	test('shows the settings dialog within the screen', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('button', { name: 'Settings' }).tap();

		const box = (await page.getByRole('dialog', { name: 'Settings' }).boundingBox())!;
		expect(box.x).toBeGreaterThanOrEqual(0);
		expect(box.x + box.width).toBeLessThanOrEqual(375);
		expect(box.y + box.height).toBeLessThanOrEqual(667);
	});
});

test.describe('on a desktop screen', () => {
	test('uses the full footer', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByText('Shivank Kapoor')).toBeVisible();
		await expect(page.getByText('S. Kapoor')).toBeHidden();
	});
});
