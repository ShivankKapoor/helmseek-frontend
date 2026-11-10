export interface WeatherResult {
	temperature: number;
	weatherCode: number;
	windSpeed: number;
	windDirection: number;
	isDay: boolean;
	description: string;
}

export interface GeoLocation {
	city: string;
	lat: number;
	lng: number;
}

/** The weather snapshot the backend stores on the user's row (see POST /user/weather). */
export interface WeatherCache {
	cachedTemperature: number;
	cachedWeatherCode: number;
	cachedWindDirection: number;
	cachedWindSpeed: number;
	cachedWeatherDescription: string;
	cachedIsDay: boolean;
}
