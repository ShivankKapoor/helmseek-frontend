import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/preact';
import { saveWeatherCache } from '@/lib/api/config';
import { fetchWeather } from '@/lib/api/weather';
import { setAuthenticated } from '@/lib/state/auth';
import { config } from '@/lib/state/config';
import type { UserConfig } from '@/lib/types/config';
import { resetAppState, setConfig } from '@/test/helpers';
import { WeatherWidget } from './WeatherWidget';

vi.mock('@/lib/api/weather', () => ({ fetchWeather: vi.fn() }));
vi.mock('@/lib/api/config', () => ({ saveWeatherCache: vi.fn().mockResolvedValue(undefined), saveConfig: vi.fn() }));

const FRESH = () => new Date().toISOString();
const STALE = '2020-01-01T00:00:00.000Z';

const withLocation: Partial<UserConfig> = {
	weatherEnabled: true,
	weatherCity: 'Austin',
	weatherLat: 30.27,
	weatherLng: -97.74
};

const withCachedReading = (lastWeatherUpdate: string): Partial<UserConfig> => ({
	...withLocation,
	cachedTemperature: 72,
	cachedWeatherCode: 0,
	cachedWindDirection: 90,
	cachedWindSpeed: 4,
	cachedWeatherDescription: 'Clear',
	cachedIsDay: true,
	lastWeatherUpdate
});

beforeEach(() => {
	resetAppState();
	vi.mocked(fetchWeather).mockReset();
	vi.mocked(saveWeatherCache).mockClear();
	vi.mocked(fetchWeather).mockResolvedValue({
		temperature: 65,
		weatherCode: 3,
		windSpeed: 9,
		windDirection: 270,
		isDay: false,
		description: 'Overcast'
	});
});

describe('WeatherWidget', () => {
	it('renders nothing when disabled', () => {
		setConfig({ ...withCachedReading(FRESH()), weatherEnabled: false });
		const { container } = render(<WeatherWidget />);
		expect(container).toBeEmptyDOMElement();
	});

	it('shows the cached reading without refetching when it is fresh', () => {
		setConfig(withCachedReading(FRESH()));
		render(<WeatherWidget />);

		expect(screen.getByText('72°F')).toBeInTheDocument();
		expect(screen.getByText('Austin')).toBeInTheDocument();
		expect(screen.getByText('4 mph E')).toBeInTheDocument();
		expect(screen.getByText('Daytime')).toBeInTheDocument();
		expect(fetchWeather).not.toHaveBeenCalled();
	});

	it('prompts for setup when no location has been chosen', () => {
		setConfig({ weatherEnabled: true });
		render(<WeatherWidget />);

		expect(screen.getByText('Setup weather')).toBeInTheDocument();
		expect(fetchWeather).not.toHaveBeenCalled();
	});

	it('refreshes a stale reading and stores it locally', async () => {
		setConfig(withCachedReading(STALE));
		render(<WeatherWidget />);

		expect(await screen.findByText('65°F')).toBeInTheDocument();
		expect(fetchWeather).toHaveBeenCalledWith(30.27, -97.74);
		expect(config.value.cachedTemperature).toBe(65);
		expect(config.value.lastWeatherUpdate).not.toBe(STALE);
	});

	it('shares a refreshed reading with the backend only when signed in', async () => {
		setConfig(withCachedReading(STALE));
		const signedOut = render(<WeatherWidget />);
		await screen.findByText('65°F');
		expect(saveWeatherCache).not.toHaveBeenCalled();
		signedOut.unmount();

		setAuthenticated('test');
		setConfig(withCachedReading(STALE));
		render(<WeatherWidget />);
		await waitFor(() => expect(saveWeatherCache).toHaveBeenCalledTimes(1));
		expect(saveWeatherCache).toHaveBeenCalledWith(
			expect.objectContaining({ cachedTemperature: 65, cachedWeatherDescription: 'Overcast', cachedIsDay: false })
		);
	});

	it('shows an error when the refresh fails', async () => {
		vi.mocked(fetchWeather).mockRejectedValue(new Error('rate limited'));
		setConfig(withCachedReading(STALE));
		render(<WeatherWidget />);

		expect(await screen.findByText('Weather unavailable')).toBeInTheDocument();
	});
});
