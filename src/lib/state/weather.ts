import { signal } from '@preact/signals';
import { fetchWeather } from '@/lib/api/weather';
import { saveWeatherCache } from '@/lib/api/config';
import { authenticated } from '@/lib/state/auth';
import { config, updateConfig } from '@/lib/state/config';
import { toWeatherCache } from '@/lib/utils/weather';

export const weatherLoading = signal(false);
export const weatherFailed = signal(false);

/** Fetches fresh weather for the saved location, stores it locally and shares it with the backend. */
export async function syncWeather(): Promise<void> {
	const { weatherLat, weatherLng } = config.value;
	if (weatherLoading.value) return;

	weatherLoading.value = true;
	weatherFailed.value = false;
	try {
		const cache = toWeatherCache(await fetchWeather(weatherLat, weatherLng));
		updateConfig({ ...cache, lastWeatherUpdate: new Date().toISOString() });
		if (authenticated.value) saveWeatherCache(cache).catch(() => {});
	} catch {
		weatherFailed.value = true;
	} finally {
		weatherLoading.value = false;
	}
}
