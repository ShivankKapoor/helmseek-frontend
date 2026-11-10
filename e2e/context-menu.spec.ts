import type { Locator, Page } from '@playwright/test';
import { expect, test, SAMPLE_QUOTE } from './fixtures';

const VIEWPORT = { width: 1280, height: 800 };
test.use({ viewport: VIEWPORT });

/** The menu fades in by scaling from its top-left corner, so wait for that to finish before measuring. */
async function openedMenuBox(menu: Locator) {
	await menu.waitFor();
	await menu.evaluate((el) => Promise.all(el.getAnimations().map((animation) => animation.finished)));
	return (await menu.boundingBox())!;
}

const rightClickAt = (page: Page, x: number, y: number) => page.mouse.click(x, y, { button: 'right' });

test.describe('right-click menu', () => {
	test('opens at the mouse pointer', async ({ page }) => {
		await page.goto('/');
		await rightClickAt(page, 400, 300);

		const box = await openedMenuBox(page.getByRole('menu'));
		expect(box.x).toBeCloseTo(400, 0);
		expect(box.y).toBeCloseTo(300, 0);
	});

	test('follows the pointer to a different spot each time', async ({ page }) => {
		await page.goto('/');
		await rightClickAt(page, 200, 150);
		await openedMenuBox(page.getByRole('menu'));

		await rightClickAt(page, 900, 500);
		const box = await openedMenuBox(page.getByRole('menu'));
		expect(box.x).toBeCloseTo(900, 0);
		expect(box.y).toBeCloseTo(500, 0);
	});

	test('stays fully on screen when opened in the bottom-right corner', async ({ page }) => {
		await page.goto('/');
		await rightClickAt(page, VIEWPORT.width - 3, VIEWPORT.height - 3);

		const box = await openedMenuBox(page.getByRole('menu'));
		expect(box.x).toBeGreaterThanOrEqual(0);
		expect(box.y).toBeGreaterThanOrEqual(0);
		expect(box.x + box.width).toBeLessThanOrEqual(VIEWPORT.width);
		expect(box.y + box.height).toBeLessThanOrEqual(VIEWPORT.height);
	});

	test('stays on screen when it has the extra "hide quote" item on a short window', async ({ page, api }) => {
		// On a very short window the quote sits just above the bottom edge, so its taller
		// two-item menu has little room below the pointer.
		const SHORT_HEIGHT = 300;
		api.startSignedIn({ motdEnabled: true });
		await page.setViewportSize({ width: VIEWPORT.width, height: SHORT_HEIGHT });
		await page.goto('/');
		const quote = page.getByText(`— ${SAMPLE_QUOTE.author}`);
		await expect(quote).toBeVisible();
		const quoteBox = (await quote.boundingBox())!;
		expect(quoteBox.y + quoteBox.height).toBeGreaterThan(SHORT_HEIGHT - 80); // really near the bottom

		await quote.click({ button: 'right' });
		const menu = page.getByRole('menu');
		await expect(menu.getByRole('menuitem')).toHaveCount(2);

		const box = await openedMenuBox(menu);
		expect(box.y).toBeGreaterThanOrEqual(0);
		expect(box.y + box.height).toBeLessThanOrEqual(SHORT_HEIGHT);
	});

	test('does not appear when Shift is held, so the browser menu stays reachable', async ({ page }) => {
		await page.goto('/');
		await page.keyboard.down('Shift');
		await rightClickAt(page, 400, 300);
		await page.keyboard.up('Shift');
		await expect(page.getByRole('menu')).toHaveCount(0);
	});

	test('closes on a click elsewhere and on Escape', async ({ page }) => {
		await page.goto('/');
		await rightClickAt(page, 400, 300);
		await expect(page.getByRole('menu')).toBeVisible();
		await page.mouse.click(100, 100);
		await expect(page.getByRole('menu')).toHaveCount(0);

		await rightClickAt(page, 400, 300);
		await expect(page.getByRole('menu')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.getByRole('menu')).toHaveCount(0);
	});
});
