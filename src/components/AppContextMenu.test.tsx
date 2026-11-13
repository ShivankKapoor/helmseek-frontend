import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { saveWeatherCache } from '@/lib/api/config';
import { fetchWeather } from '@/lib/api/weather';
import { setAuthenticated } from '@/lib/state/auth';
import { config } from '@/lib/state/config';
import { weatherFailed, weatherLoading } from '@/lib/state/weather';
import { resetAppState, setConfig } from '@/test/helpers';
import { AppContextMenu } from './AppContextMenu';
import { WeatherWidget } from './WeatherWidget';

vi.mock('@/lib/api/weather', () => ({ fetchWeather: vi.fn() }));
vi.mock('@/lib/api/config', () => ({ saveWeatherCache: vi.fn().mockResolvedValue(undefined), saveConfig: vi.fn() }));

const FRESH_READING = {
	weatherEnabled: true,
	weatherCity: 'Austin',
	weatherLat: 30.27,
	weatherLng: -97.74,
	cachedTemperature: 72,
	cachedWeatherCode: 0,
	cachedWindDirection: 90,
	cachedWindSpeed: 4,
	cachedWeatherDescription: 'Clear',
	cachedIsDay: true,
	lastWeatherUpdate: new Date().toISOString()
};

function renderPage() {
	return render(
		<>
			<WeatherWidget />
			<AppContextMenu />
		</>
	);
}

function rightClickWidget() {
	fireEvent.contextMenu(screen.getByText('72°F'));
}

beforeEach(() => {
	resetAppState();
	weatherLoading.value = false;
	weatherFailed.value = false;
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
	setConfig(FRESH_READING);
});

describe('AppContextMenu weather sync', () => {
	it('offers Sync on the weather widget when signed in', () => {
		setAuthenticated('test');
		renderPage();
		rightClickWidget();

		expect(screen.getByRole('menuitem', { name: /sync/i })).toBeInTheDocument();
	});

	it('does not offer Sync when signed out', () => {
		renderPage();
		rightClickWidget();

		expect(screen.queryByRole('menuitem', { name: /sync/i })).not.toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: /settings/i })).toBeInTheDocument();
	});

	it('does not offer Sync when right-clicking elsewhere', () => {
		setAuthenticated('test');
		renderPage();
		fireEvent.contextMenu(document.body);

		expect(screen.queryByRole('menuitem', { name: /sync/i })).not.toBeInTheDocument();
	});

	it('refetches even though the reading is fresh, then updates and saves it', async () => {
		setAuthenticated('test');
		renderPage();
		expect(fetchWeather).not.toHaveBeenCalled();

		rightClickWidget();
		fireEvent.click(screen.getByRole('menuitem', { name: /sync/i }));

		expect(await screen.findByText('65°F')).toBeInTheDocument();
		expect(fetchWeather).toHaveBeenCalledWith(30.27, -97.74);
		expect(config.value.cachedTemperature).toBe(65);
		await waitFor(() => expect(saveWeatherCache).toHaveBeenCalledTimes(1));
		expect(saveWeatherCache).toHaveBeenCalledWith(
			expect.objectContaining({ cachedTemperature: 65, cachedWeatherDescription: 'Overcast' })
		);
	});

	it('shows an error when the manual sync fails', async () => {
		setAuthenticated('test');
		vi.mocked(fetchWeather).mockRejectedValue(new Error('rate limited'));
		renderPage();

		rightClickWidget();
		fireEvent.click(screen.getByRole('menuitem', { name: /sync/i }));

		expect(await screen.findByText('Weather unavailable')).toBeInTheDocument();
		expect(saveWeatherCache).not.toHaveBeenCalled();
	});

	it('ignores a second sync while one is already running', async () => {
		setAuthenticated('test');
		let finish!: (value: Awaited<ReturnType<typeof fetchWeather>>) => void;
		vi.mocked(fetchWeather).mockReturnValue(new Promise((resolve) => (finish = resolve)));
		renderPage();

		rightClickWidget();
		fireEvent.click(screen.getByRole('menuitem', { name: /sync/i }));
		await screen.findByText('Loading...');
		fireEvent.contextMenu(screen.getByText('Loading...'));
		fireEvent.click(screen.getByRole('menuitem', { name: /sync/i }));

		expect(fetchWeather).toHaveBeenCalledTimes(1);
		finish({ temperature: 65, weatherCode: 3, windSpeed: 9, windDirection: 270, isDay: false, description: 'Overcast' });
		expect(await screen.findByText('65°F')).toBeInTheDocument();
	});
});

describe('AppContextMenu gliding', () => {
	const menu = () => screen.getByRole('menu');

	it('does not glide when it first opens', () => {
		renderPage();
		fireEvent.contextMenu(document.body, { clientX: 10, clientY: 20 });

		expect(menu().className).not.toMatch(/gliding/);
	});

	it('glides to the new spot when right-clicked again while open', () => {
		renderPage();
		fireEvent.contextMenu(document.body, { clientX: 10, clientY: 20 });
		fireEvent.contextMenu(document.body, { clientX: 100, clientY: 200 });

		expect(menu().className).toMatch(/gliding/);
		expect(menu().style.top).toBe('200px');
		expect(menu().style.left).toBe('100px');
	});

	it('does not glide when reopened after being closed', () => {
		renderPage();
		fireEvent.contextMenu(document.body, { clientX: 10, clientY: 20 });
		fireEvent.contextMenu(document.body, { clientX: 100, clientY: 200 });
		fireEvent.click(document.body);
		expect(screen.queryByRole('menu')).not.toBeInTheDocument();

		fireEvent.contextMenu(document.body, { clientX: 50, clientY: 60 });
		expect(menu().className).not.toMatch(/gliding/);
	});
});
