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

test.describe('right-click menu on a quick link', () => {
	const DOCS_URL = 'https://docs.example.com/';

	const quickLink = (overrides: Record<string, unknown> = {}) => ({
		id: 'ql_1', enabled: true, text: 'Docs', url: DOCS_URL, corner: 'top-left', order: 0, ...overrides
	});

	/** Saves quick links into the browser's local settings before the page loads. */
	const seedQuickLinks = (page: Page, links: unknown[]) =>
		page.addInitScript((quickLinks) => {
			localStorage.setItem('helm_config', JSON.stringify({ quickLinksEnabled: true, quickLinks }));
		}, links);

	test.beforeEach(async ({ page }) => {
		// The destination is stubbed for the page and for any new tab the menu opens.
		await page.context().route(`${DOCS_URL}**`, (route) =>
			route.fulfill({ contentType: 'text/html', body: '<title>Docs</title>' })
		);
	});

	test('offers new tab and current tab, next to Settings', async ({ page }) => {
		await seedQuickLinks(page, [quickLink()]);
		await page.goto('/');
		await page.getByRole('link', { name: 'Docs' }).click({ button: 'right' });

		const menu = page.getByRole('menu');
		await expect(menu.getByRole('menuitem')).toHaveText([/Open in new tab/, /Open in current tab/, /Settings/]);
	});

	test('"Open in current tab" loads the link in this tab', async ({ page }) => {
		await seedQuickLinks(page, [quickLink()]);
		await page.goto('/');
		await page.getByRole('link', { name: 'Docs' }).click({ button: 'right' });
		await page.getByRole('menuitem', { name: 'Open in current tab' }).click();

		await expect(page).toHaveURL(DOCS_URL);
	});

	test('"Open in new tab" opens a second tab and leaves this one alone', async ({ page }) => {
		await seedQuickLinks(page, [quickLink()]);
		await page.goto('/');
		await page.getByRole('link', { name: 'Docs' }).click({ button: 'right' });

		// Chrome already implies noopener for target=_blank, but other browsers rely on the attribute.
		const newTabItem = page.getByRole('menuitem', { name: 'Open in new tab' });
		await expect(newTabItem).toHaveAttribute('target', '_blank');
		await expect(newTabItem).toHaveAttribute('rel', 'noopener noreferrer');

		const [newTab] = await Promise.all([page.waitForEvent('popup'), newTabItem.click()]);

		await newTab.waitForURL(DOCS_URL);
		await expect(page).toHaveURL('/');
		// noopener: the new page cannot reach back into HelmSeek.
		expect(await newTab.evaluate(() => window.opener)).toBeNull();
		await expect(page.getByRole('menu')).toHaveCount(0);
	});

	test('a normal left click still opens the link in this tab', async ({ page }) => {
		await seedQuickLinks(page, [quickLink()]);
		await page.goto('/');
		await page.getByRole('link', { name: 'Docs' }).click();

		await expect(page).toHaveURL(DOCS_URL);
	});

	test('the link items only appear on a link, not elsewhere on the page', async ({ page }) => {
		await seedQuickLinks(page, [quickLink()]);
		await page.goto('/');
		await rightClickAt(page, 640, 600);

		await expect(page.getByRole('menuitem', { name: 'Settings' })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: /Open in/ })).toHaveCount(0);
	});

	test('never offers to open an address that is not http or https', async ({ page }) => {
		page.on('dialog', (dialog) => { throw new Error(`a script ran: ${dialog.message()}`); });
		await seedQuickLinks(page, [quickLink({ text: 'Sneaky', url: 'javascript:alert(1)' })]);
		await page.goto('/');
		await page.getByRole('link', { name: 'Sneaky' }).click({ button: 'right' });

		await expect(page.getByRole('menuitem', { name: 'Settings' })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: /Open in/ })).toHaveCount(0);
	});

	test('the taller link menu stays on screen for a link near the bottom edge', async ({ page }) => {
		await seedQuickLinks(page, [quickLink({ corner: 'bottom-left' })]);
		await page.goto('/');
		await page.getByRole('link', { name: 'Docs' }).click({ button: 'right' });

		const box = await openedMenuBox(page.getByRole('menu'));
		expect(box.y).toBeGreaterThanOrEqual(0);
		expect(box.y + box.height).toBeLessThanOrEqual(VIEWPORT.height);
		expect(box.x + box.width).toBeLessThanOrEqual(VIEWPORT.width);
	});
});
