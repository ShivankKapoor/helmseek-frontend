import type { WeatherCache, WeatherResult } from '@/lib/types/weather';

const STALE_AFTER_MS = 30 * 60 * 1000;
const COMPASS_POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export function toWeatherCache(result: WeatherResult): WeatherCache {
	return {
		cachedTemperature: result.temperature,
		cachedWeatherCode: result.weatherCode,
		cachedWindDirection: result.windDirection,
		cachedWindSpeed: result.windSpeed,
		cachedWeatherDescription: result.description,
		cachedIsDay: result.isDay
	};
}

export function isWeatherStale(lastUpdate: string | null): boolean {
	return !lastUpdate || Date.now() - new Date(lastUpdate).getTime() > STALE_AFTER_MS;
}

/** Bootstrap Icons class for a WMO weather code. */
export function weatherIconClass(code: number | null, isDay: boolean | null): string {
	if (code === null) return 'bi bi-thermometer-half';
	if (code === 0) return isDay ? 'bi bi-sun' : 'bi bi-moon';
	if (code <= 2) return isDay ? 'bi bi-cloud-sun' : 'bi bi-cloud-moon';
	if (code === 3) return 'bi bi-clouds';
	if (code <= 49) return 'bi bi-cloud-fog2';
	if (code <= 69) return 'bi bi-cloud-rain';
	if (code <= 79) return 'bi bi-snow';
	if (code <= 84) return 'bi bi-cloud-drizzle';
	return 'bi bi-cloud-lightning-rain';
}

export function windDegreesToCompass(degrees: number): string {
	return COMPASS_POINTS[Math.round(degrees / 45) % 8];
}

export function formatTimeAgo(timestamp: string): string {
	const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60_000);
	if (minutes < 1) return 'just now';
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	return new Date(timestamp).toLocaleDateString();
}
