import type { GeoLocation, WeatherResult } from '$lib/types/weather';

const GEOCODE_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

export async function geocodeZip(zip: string): Promise<GeoLocation> {
	const res = await fetch(`${GEOCODE_API}?name=${encodeURIComponent(zip)}&count=5&language=en&format=json`);
	if (!res.ok) throw new Error('Geocoding failed');
	const data = await res.json();
	const results: any[] = data.results ?? [];
	if (results.length === 0) throw new Error('Location not found');
	const match = results.find((r) => r.country_code === 'US') ?? results[0];
	return { city: match.name, lat: match.latitude, lng: match.longitude };
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherResult> {
	const params = new URLSearchParams({
		latitude: lat.toString(),
		longitude: lng.toString(),
		current_weather: 'true',
		temperature_unit: 'fahrenheit',
		windspeed_unit: 'mph',
		timezone: 'auto'
	});
	const res = await fetch(`${WEATHER_API}?${params}`);
	if (!res.ok) throw new Error('Weather fetch failed');
	const data = await res.json();
	const cw = data.current_weather;
	return {
		temperature: Math.round(cw.temperature),
		weatherCode: cw.weathercode,
		windSpeed: cw.windspeed,
		windDirection: cw.winddirection,
		isDay: cw.is_day === 1,
		description: codeToDescription(cw.weathercode)
	};
}

function codeToDescription(code: number): string {
	if (code === 0) return 'Clear';
	if (code <= 2) return 'Partly Cloudy';
	if (code === 3) return 'Overcast';
	if (code <= 49) return 'Fog';
	if (code <= 59) return 'Drizzle';
	if (code <= 69) return 'Rain';
	if (code <= 79) return 'Snow';
	if (code <= 84) return 'Showers';
	return 'Thunderstorm';
}
