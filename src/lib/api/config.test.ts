import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG, type QuickLink, type UserConfigDTO } from '@/lib/types/config';
import { fetchConfig, saveConfig, saveWeatherCache } from './config';

const fetchMock = vi.fn();

function respondWith(body: unknown) {
	fetchMock.mockResolvedValueOnce(
		new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
	);
}

const link: QuickLink = { id: 'ql_1', enabled: true, text: 'Docs', url: 'https://example.com', corner: 'top-left', order: 0 };
const dto = (quickLinks: string): UserConfigDTO => ({ ...DEFAULT_CONFIG, quickLinks });

beforeEach(() => {
	vi.stubGlobal('fetch', fetchMock);
	fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
});

afterEach(() => {
	fetchMock.mockReset();
	vi.unstubAllGlobals();
});

describe('fetchConfig', () => {
	it('parses the quick links JSON string into an array', async () => {
		respondWith(dto(JSON.stringify([link])));
		const config = await fetchConfig();
		expect(config.quickLinks).toEqual([link]);
	});

	it('falls back to no quick links when the JSON is malformed', async () => {
		respondWith(dto('{oops'));
		expect((await fetchConfig()).quickLinks).toEqual([]);
	});
});

describe('saveConfig', () => {
	it('POSTs the config with quick links serialized as a JSON string', async () => {
		await saveConfig({ ...DEFAULT_CONFIG, themeMode: 'dark', quickLinks: [link] });

		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('http://api.test/user/config');
		expect(init.method).toBe('POST');
		const body = JSON.parse(init.body);
		expect(body.themeMode).toBe('dark');
		expect(body.quickLinks).toBe(JSON.stringify([link]));
	});
});

describe('saveWeatherCache', () => {
	it('POSTs the weather snapshot', async () => {
		const cache = {
			cachedTemperature: 70,
			cachedWeatherCode: 0,
			cachedWindDirection: 90,
			cachedWindSpeed: 3,
			cachedWeatherDescription: 'Clear',
			cachedIsDay: true
		};
		await saveWeatherCache(cache);

		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('http://api.test/user/weather');
		expect(JSON.parse(init.body)).toEqual(cache);
	});
});
