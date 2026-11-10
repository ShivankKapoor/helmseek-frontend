import { expect, test, SAMPLE_QUOTE } from './fixtures';

const MORNING = new Date(2026, 10, 9, 9, 30, 15);

test.describe('hero widget', () => {
	test.beforeEach(async ({ page }) => {
		await page.clock.install({ time: MORNING });
	});

	test('greets by time of day and shows the date', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByText('Good Morning')).toBeVisible();
		await expect(page.getByText('Monday, November 9, 2026')).toBeVisible();
	});

	test('greets differently in the evening', async ({ page }) => {
		await page.clock.setFixedTime(new Date(2026, 10, 9, 19, 0, 0));
		await page.goto('/');
		await expect(page.getByText('Good Evening')).toBeVisible();
	});

	test('shows a clock in the saved format', async ({ page, api }) => {
		api.startSignedIn({ heroMode: 'both', heroClockFormat: '24h', heroShowSeconds: true });
		await page.goto('/');
		await expect(page.getByText('09:30:15')).toBeVisible();
	});

	test('keeps the clock running', async ({ page, api }) => {
		api.startSignedIn({ heroMode: 'clock', heroShowSeconds: true });
		await page.goto('/');
		await expect(page.getByText('9:30:15 AM')).toBeVisible();

		await page.clock.fastForward(5000);
		await expect(page.getByText('9:30:20 AM')).toBeVisible();
	});
});

test.describe('weather widget', () => {
	const cachedWeather = {
		weatherEnabled: true,
		weatherCity: 'Austin',
		weatherLat: 30.27,
		weatherLng: -97.74,
		cachedTemperature: 58,
		cachedWeatherCode: 3,
		cachedWindDirection: 270,
		cachedWindSpeed: 9,
		cachedWeatherDescription: 'Overcast',
		cachedIsDay: false
	};

	test('shows a fresh cached reading without calling the weather service', async ({ page, api }) => {
		api.startSignedIn({ ...cachedWeather, lastWeatherUpdate: new Date().toISOString() });
		let weatherCalls = 0;
		await page.route('https://api.open-meteo.com/**', (route) => {
			weatherCalls++;
			return route.abort();
		});

		await page.goto('/');
		await expect(page.getByText('58°F')).toBeVisible();
		await expect(page.getByText('9 mph W')).toBeVisible();
		await expect(page.getByText('Nighttime')).toBeVisible();
		expect(weatherCalls).toBe(0);
	});

	test('refreshes a stale reading and shares it with the backend', async ({ page, api }) => {
		api.startSignedIn({ ...cachedWeather, lastWeatherUpdate: '2020-01-01T00:00:00.000Z' });
		await page.goto('/');

		await expect(page.getByText('72°F')).toBeVisible();
		await expect.poll(() => api.requestsTo('POST', '/user/weather')).toHaveLength(1);
		expect(api.requestsTo('POST', '/user/weather')[0].body).toMatchObject({
			cachedTemperature: 72,
			cachedWeatherDescription: 'Clear',
			cachedIsDay: true
		});
	});

	test('says so when the weather service is unavailable', async ({ page, api }) => {
		api.startSignedIn({ ...cachedWeather, lastWeatherUpdate: '2020-01-01T00:00:00.000Z' });
		await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ status: 500 }));

		await page.goto('/');
		await expect(page.getByText('Weather unavailable')).toBeVisible();
	});

	test('prompts for setup until a location is chosen', async ({ page, api }) => {
		api.startSignedIn({ weatherEnabled: true });
		await page.goto('/');
		await expect(page.getByText('Setup weather')).toBeVisible();
	});
});

test.describe('quote of the day', () => {
	test('shows the quote and author when enabled', async ({ page, api }) => {
		api.startSignedIn({ motdEnabled: true });
		await page.goto('/');

		// The quote animates in one character per element, so check the container's text.
		await expect(page.locator('[data-context-menu="quote"]')).toContainText(`“${SAMPLE_QUOTE.quote}”`);
		await expect(page.getByText(`— ${SAMPLE_QUOTE.author}`)).toBeVisible();
	});

	test('is not requested when disabled', async ({ page, api }) => {
		api.startSignedIn({ motdEnabled: false });
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		expect(api.requestsTo('GET', '/quote')).toHaveLength(0);
	});

	test('is not requested when signed out', async ({ page, api }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		expect(api.requestsTo('GET', '/quote')).toHaveLength(0);
	});

	test('stays hidden when the user has hidden today’s quote', async ({ page, api }) => {
		api.startSignedIn({ motdEnabled: true, hideQuote: true });
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		expect(api.requestsTo('GET', '/quote')).toHaveLength(0);
		await expect(page.getByText(`— ${SAMPLE_QUOTE.author}`)).toHaveCount(0);
	});

	test('can be hidden from the right-click menu', async ({ page, api }) => {
		api.startSignedIn({ motdEnabled: true });
		await page.goto('/');
		await page.getByText(`— ${SAMPLE_QUOTE.author}`).click({ button: 'right' });
		await page.getByRole('menuitem', { name: 'Hide until tomorrow' }).click();

		await expect(page.getByText(`— ${SAMPLE_QUOTE.author}`)).toHaveCount(0);
		expect(api.requestsTo('POST', '/quote/hideQuote')).toHaveLength(1);
	});

	test('can be hidden and shown again from settings', async ({ page, api }) => {
		api.startSignedIn({ motdEnabled: true });
		await page.goto('/');
		await page.getByRole('button', { name: 'Settings' }).click();
		const dialog = page.getByRole('dialog', { name: 'Settings' });

		await dialog.getByLabel("Hide today's quote").check();
		await expect(page.getByText(`— ${SAMPLE_QUOTE.author}`)).toHaveCount(0);
		expect(api.requestsTo('POST', '/quote/hideQuote')).toHaveLength(1);

		await dialog.getByLabel("Hide today's quote").uncheck();
		await expect(page.getByText(`— ${SAMPLE_QUOTE.author}`)).toBeVisible();
		expect(api.requestsTo('POST', '/quote/unhideQuote')).toHaveLength(1);
	});
});
