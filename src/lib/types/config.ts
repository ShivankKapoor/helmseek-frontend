export interface QuickLink {
	id: string;
	enabled: boolean;
	text: string;
	url: string;
	corner: 'top-left' | 'top-right' | 'bottom-left';
	order?: number;
}

export interface UserConfig {
	username: string;
	themeMode: 'light' | 'dark';
	selectedColor: string;
	heroEnabled: boolean;
	heroMode: 'greeting' | 'clock' | 'both' | 'none';
	heroClockFormat: '12h' | '24h';
	heroShowSeconds: boolean;
	heroGreetingName: string;
	weatherEnabled: boolean;
	weatherZip: string;
	weatherCorner: 'top-right' | 'top-left' | 'bottom-left';
	weatherCity: string;
	weatherLat: number;
	weatherLng: number;
	quickLinksEnabled: boolean;
	quickLinks: QuickLink[];
	cachedTemperature: number | null;
	cachedWeatherCode: number | null;
	cachedWindDirection: number | null;
	cachedWindSpeed: number | null;
	cachedWeatherDescription: string | null;
	cachedIsDay: boolean | null;
	lastWeatherUpdate: string | null;
}

// Shape the backend sends/receives (quickLinks is a JSON string)
export interface UserConfigDTO extends Omit<UserConfig, 'quickLinks'> {
	quickLinks: string;
}

export const DEFAULT_CONFIG: UserConfig = {
	username: '',
	themeMode: 'light',
	selectedColor: '#1a73e8,#155ab6',
	heroEnabled: true,
	heroMode: 'greeting',
	heroClockFormat: '12h',
	heroShowSeconds: false,
	heroGreetingName: '',
	weatherEnabled: false,
	weatherZip: '',
	weatherCorner: 'top-right',
	weatherCity: '',
	weatherLat: 0,
	weatherLng: 0,
	quickLinksEnabled: false,
	quickLinks: [],
	cachedTemperature: null,
	cachedWeatherCode: null,
	cachedWindDirection: null,
	cachedWindSpeed: null,
	cachedWeatherDescription: null,
	cachedIsDay: null,
	lastWeatherUpdate: null
};

export const COLOR_OPTIONS = [
	{ name: 'Blue',   value: '#1a73e8,#155ab6' },
	{ name: 'Yellow', value: '#fbbc05,#c69000' },
	{ name: 'Green',  value: '#34a853,#2e7d32' },
	{ name: 'Red',    value: '#ea4335,#b03a2e' },
	{ name: 'Purple', value: '#9B59B6,#6B3F87' },
	{ name: 'Teal',   value: '#3B7F70,#0A5F50' },
	{ name: 'Orange', value: '#FF6720,#CC4F00' },
	{ name: 'Maroon', value: '#8B0000,#A52A2A' },
] as const;
