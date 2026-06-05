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
