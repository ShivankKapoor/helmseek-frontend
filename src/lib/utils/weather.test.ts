import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WeatherResult } from '@/lib/types/weather';
import {
	formatTimeAgo,
	isWeatherStale,
	toWeatherCache,
	weatherIconClass,
	windDegreesToCompass
} from './weather';

const NOW = new Date('2026-11-09T12:00:00Z');
const minutesAgo = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000).toISOString();

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(NOW);
});

describe('toWeatherCache', () => {
	it('maps a weather result onto the backend cache fields', () => {
		const result: WeatherResult = {
			temperature: 72,
			weatherCode: 3,
			windSpeed: 5.5,
			windDirection: 270,
			isDay: true,
			description: 'Overcast'
		};
		expect(toWeatherCache(result)).toEqual({
			cachedTemperature: 72,
			cachedWeatherCode: 3,
			cachedWindDirection: 270,
			cachedWindSpeed: 5.5,
			cachedWeatherDescription: 'Overcast',
			cachedIsDay: true
		});
	});
});

describe('isWeatherStale', () => {
	it('is stale when there has never been an update', () => {
		expect(isWeatherStale(null)).toBe(true);
	});

	it('is fresh within 30 minutes and stale after', () => {
		expect(isWeatherStale(minutesAgo(29))).toBe(false);
		expect(isWeatherStale(minutesAgo(30))).toBe(false);
		expect(isWeatherStale(minutesAgo(31))).toBe(true);
	});
});

describe('weatherIconClass', () => {
	it.each([
		[null, true, 'bi bi-thermometer-half'],
		[0, true, 'bi bi-sun'],
		[0, false, 'bi bi-moon'],
		[2, true, 'bi bi-cloud-sun'],
		[2, false, 'bi bi-cloud-moon'],
		[3, true, 'bi bi-clouds'],
		[45, true, 'bi bi-cloud-fog2'],
		[61, true, 'bi bi-cloud-rain'],
		[73, true, 'bi bi-snow'],
		[81, true, 'bi bi-cloud-drizzle'],
		[95, true, 'bi bi-cloud-lightning-rain']
	])('code %s (day: %s) -> %s', (code, isDay, expected) => {
		expect(weatherIconClass(code, isDay)).toBe(expected);
	});
});

describe('windDegreesToCompass', () => {
	it.each([
		[0, 'N'],
		[45, 'NE'],
		[90, 'E'],
		[180, 'S'],
		[270, 'W'],
		[315, 'NW'],
		[350, 'N'],
		[360, 'N']
	])('%s degrees -> %s', (degrees, expected) => {
		expect(windDegreesToCompass(degrees)).toBe(expected);
	});
});

describe('formatTimeAgo', () => {
	it('uses minutes, hours, then a date', () => {
		expect(formatTimeAgo(minutesAgo(0))).toBe('just now');
		expect(formatTimeAgo(minutesAgo(5))).toBe('5m ago');
		expect(formatTimeAgo(minutesAgo(59))).toBe('59m ago');
		expect(formatTimeAgo(minutesAgo(60))).toBe('1h ago');
		expect(formatTimeAgo(minutesAgo(23 * 60))).toBe('23h ago');
		expect(formatTimeAgo(minutesAgo(48 * 60))).toBe(new Date(minutesAgo(48 * 60)).toLocaleDateString());
	});
});
