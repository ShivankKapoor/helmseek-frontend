import { test as base, expect, type Page, type Route } from '@playwright/test';
import { DEFAULT_CONFIG, type QuickLink, type UserConfigDTO } from '../src/lib/types/config';

export const TEST_USER = { username: 'test', password: 'test12345' };
export const SAMPLE_QUOTE = { quote: 'Be kind', author: 'Someone' };

/** What the weather stubs return: 71.6°F rounds to 72°F in the UI. */
export const SAMPLE_WEATHER = { city: 'Austin', lat: 30.27, lng: -97.74, rawTemperature: 71.6 };

type ConfigOverrides = Partial<Omit<UserConfigDTO, 'quickLinks'>> & { quickLinks?: QuickLink[] };

interface RecordedRequest {
	method: string;
	path: string;
	body: unknown;
}

const API_PATHS = /^\/(user|auth|quote)(\/|$)/;

/**
 * An in-memory stand-in for the HelmSeek backend. Tests use it to set up server state
 * (signed in or out, saved config, quote) and to assert on what the app sent.
 */
export class FakeApi {
	signedIn = false;
	rateLimited = false;
	quote = SAMPLE_QUOTE;
	readonly requests: RecordedRequest[] = [];

	private serverConfig: UserConfigDTO = { ...DEFAULT_CONFIG, username: TEST_USER.username, quickLinks: '[]' };

	/** Starts the test with a valid session and the given saved config. */
	startSignedIn(overrides: ConfigOverrides = {}) {
		this.signedIn = true;
		const { quickLinks, ...rest } = overrides;
		this.serverConfig = {
			...this.serverConfig,
			...rest,
			quickLinks: JSON.stringify(quickLinks ?? [])
		};
	}

	/** Makes every following authenticated request fail with a 401. */
	expireSession() {
		this.signedIn = false;
	}

	requestsTo(method: string, path: string): RecordedRequest[] {
		return this.requests.filter((r) => r.method === method && r.path === path);
	}

	/** The config most recently saved with POST /user/config, with quick links parsed. */
	lastSavedConfig() {
		const saved = this.requestsTo('POST', '/user/config').at(-1)?.body as UserConfigDTO | undefined;
		return saved && { ...saved, quickLinks: JSON.parse(saved.quickLinks) as QuickLink[] };
	}

	/** Starts answering the app's API requests (same origin as the app) for this page. */
	async install(page: Page) {
		await page.route(
			(url) => url.hostname === 'localhost' && API_PATHS.test(url.pathname),
			(route) => this.handle(route)
		);
	}

	private async handle(route: Route) {
		const request = route.request();
		const path = new URL(request.url()).pathname;
		this.requests.push({ method: request.method(), path, body: parseBody(request.postData()) });

		const json = (data: unknown, status = 200) =>
			route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
		const status = (code: number) => route.fulfill({ status: code });

		switch (`${request.method()} ${path}`) {
			case 'GET /user/config':
				return this.signedIn ? json(this.serverConfig) : status(401);

			case 'POST /user/config':
				if (!this.signedIn) return status(401);
				this.serverConfig = this.requests.at(-1)!.body as UserConfigDTO;
				return status(200);

			case 'POST /user/weather':
				return this.signedIn ? status(200) : status(401);

			case 'POST /auth/login': {
				const credentials = this.requests.at(-1)!.body as typeof TEST_USER;
				if (this.rateLimited) return status(429);
				if (credentials.username !== TEST_USER.username || credentials.password !== TEST_USER.password) {
					return status(401);
				}
				this.signedIn = true;
				return status(200);
			}

			case 'POST /auth/logout':
				this.signedIn = false;
				return status(200);

			case 'GET /quote':
				return this.signedIn ? json(this.quote) : status(401);

			case 'POST /quote/hideQuote':
			case 'POST /quote/unhideQuote':
				return this.signedIn ? status(200) : status(401);

			default:
				// An unexpected API call means the app and these stubs have drifted apart.
				return status(404);
		}
	}
}

function parseBody(raw: string | null): unknown {
	if (!raw) return undefined;
	try {
		return JSON.parse(raw);
	} catch {
		return raw;
	}
}

/** Fonts, icons, weather and Google are stubbed so tests never depend on the internet. */
async function stubThirdParties(page: Page) {
	await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net/, (route) =>
		route.fulfill({ contentType: 'text/css', body: '' })
	);

	await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
		route.fulfill({
			json: {
				results: [
					{
						name: SAMPLE_WEATHER.city,
						latitude: SAMPLE_WEATHER.lat,
						longitude: SAMPLE_WEATHER.lng,
						country_code: 'US'
					}
				]
			}
		})
	);

	await page.route('https://api.open-meteo.com/**', (route) =>
		route.fulfill({
			json: {
				current_weather: {
					temperature: SAMPLE_WEATHER.rawTemperature,
					weathercode: 0,
					windspeed: 5,
					winddirection: 90,
					is_day: 1
				}
			}
		})
	);

	await page.route('https://www.google.com/**', (route) =>
		route.fulfill({ contentType: 'text/html', body: '<title>Google</title>' })
	);
}

export const test = base.extend<{ api: FakeApi }>({
	// `auto` attaches the fake backend and stubs to every test, even ones that don't ask for `api`.
	api: [
		async ({ page }, use) => {
			const api = new FakeApi();
			await stubThirdParties(page);
			await api.install(page);
			await use(api);
		},
		{ auto: true }
	]
});

export { expect };
