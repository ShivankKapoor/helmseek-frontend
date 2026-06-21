<script lang="ts">
	import { configState } from '$lib/state/config.svelte';
	import { authState } from '$lib/state/auth.svelte';
	import { fetchWeather } from '$lib/api/weather';
	import { saveWeatherCache } from '$lib/api/config';

	const STALE_MS = 30 * 60 * 1000;

	let loading = $state(false);
	let error = $state<string | null>(null);

	let trigger = $derived({
		enabled: configState.config.weatherEnabled,
		lat: configState.config.weatherLat,
		lng: configState.config.weatherLng
	});

	$effect(() => {
		if (trigger.enabled && (trigger.lat || trigger.lng)) {
			checkAndRefresh();
		}
	});

	async function checkAndRefresh() {
		const { lastWeatherUpdate, weatherLat, weatherLng } = configState.config;
		const isStale = !lastWeatherUpdate ||
			Date.now() - new Date(lastWeatherUpdate).getTime() > STALE_MS;
		if (!isStale) return;

		loading = true;
		error = null;
		try {
			const result = await fetchWeather(weatherLat, weatherLng);
			const cache = {
				cachedTemperature: result.temperature,
				cachedWeatherCode: result.weatherCode,
				cachedWindDirection: result.windDirection,
				cachedWindSpeed: result.windSpeed,
				cachedWeatherDescription: result.description,
				cachedIsDay: result.isDay
			};
			configState.update({ ...cache, lastWeatherUpdate: new Date().toISOString() });
			if (authState.authenticated) saveWeatherCache(cache);
		} catch {
			error = 'Weather unavailable';
		} finally {
			loading = false;
		}
	}

	function getIcon(code: number | null, isDay: boolean | null): string {
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

	function locationClass(city: string | null): string {
		if (!city) return 'location';
		const len = city.length;
		if (len > 20) return 'location extremely-long-name';
		if (len > 15) return 'location very-long-name';
		if (len > 10) return 'location long-name';
		return 'location';
	}

	function windDegToCompass(deg: number): string {
		const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
		return dirs[Math.round(deg / 45) % 8];
	}

	function formatUpdated(ts: string | null): string {
		if (!ts) return '';
		const diffMin = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
		if (diffMin < 1) return 'just now';
		if (diffMin < 60) return `${diffMin}m ago`;
		const diffHr = Math.floor(diffMin / 60);
		if (diffHr < 24) return `${diffHr}h ago`;
		return new Date(ts).toLocaleDateString();
	}

	let cfg = $derived(configState.config);
</script>

{#if cfg.weatherEnabled}
	<div class="weather-widget position-{cfg.weatherCorner}">
		{#if loading}
			<div class="weather-loading">
				<i class="bi bi-arrow-clockwise spin"></i>
				<span>Loading...</span>
			</div>
		{:else if error}
			<div class="weather-error" title={error}>
				<i class="bi bi-exclamation-triangle"></i>
				<span>Weather unavailable</span>
			</div>
		{:else if cfg.cachedTemperature !== null}
			<div class="weather-content">
				<div class="weather-icon"><i class={getIcon(cfg.cachedWeatherCode, cfg.cachedIsDay)}></i></div>
				<div class="weather-info">
					<div class="temperature">{cfg.cachedTemperature}°F</div>
					<div class={locationClass(cfg.weatherCity)}>{cfg.weatherCity}</div>
				</div>
			</div>
			<div class="weather-details">
				{#if cfg.cachedWeatherDescription}
					<div class="detail-row">
						<i class="bi bi-cloud"></i>
						<span>{cfg.cachedWeatherDescription}</span>
					</div>
				{/if}
				{#if cfg.cachedWindSpeed !== null}
					<div class="detail-row">
						<i class="bi bi-wind"></i>
						<span>{cfg.cachedWindSpeed} mph {cfg.cachedWindDirection !== null ? windDegToCompass(cfg.cachedWindDirection!) : ''}</span>
					</div>
				{/if}
				{#if cfg.cachedIsDay !== null}
					<div class="detail-row">
						<i class="bi bi-{cfg.cachedIsDay ? 'sun' : 'moon'}"></i>
						<span>{cfg.cachedIsDay ? 'Daytime' : 'Nighttime'}</span>
					</div>
				{/if}
				{#if cfg.lastWeatherUpdate}
					<div class="detail-row updated-row">
						<i class="bi bi-clock"></i>
						<span>Updated {formatUpdated(cfg.lastWeatherUpdate)}</span>
					</div>
				{/if}
			</div>
		{:else}
			<div class="weather-setup">
				<i class="bi bi-geo-alt"></i>
				<span>Setup weather</span>
			</div>
		{/if}
	</div>
{/if}

<style>
	.weather-widget {
		position: fixed;
		z-index: 1000;
		background: rgba(255, 255, 255, 0.95);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 12px;
		padding: 12px 16px;
		font-family: var(--font-family);
		color: var(--text-color);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		backdrop-filter: blur(10px);
		transition: all 0.3s ease;
		min-width: 120px;
		max-width: 200px;
		user-select: none;
		cursor: default;
	}

	:global(body.dark) .weather-widget {
		background: rgba(42, 42, 42, 0.95);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.weather-widget:hover {
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
	}

	.position-top-left    { top: 20px; left: 20px; }
	.position-top-right   { top: 20px; right: 20px; }
	.position-bottom-left { bottom: 20px; left: 20px; }

	.weather-content { display: flex; align-items: center; gap: 12px; }

	.weather-icon {
		font-size: 1.5rem;
		color: var(--button-bg);
		display: flex;
		align-items: center;
	}

	.weather-info { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }

	.temperature {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-color);
		line-height: 1;
	}

	.location {
		font-size: 0.75rem;
		color: var(--footer-color);
		font-weight: 400;
		line-height: 1.1;
		max-width: 100px;
		overflow: hidden;
		word-break: break-word;
	}

	.location.long-name          { font-size: 0.65rem; max-width: 110px; }
	.location.very-long-name     { font-size: 0.6rem;  max-width: 120px; }
	.location.extremely-long-name{ font-size: 0.55rem; max-width: 130px; }

	.weather-details {
		max-height: 0;
		overflow: hidden;
		opacity: 0;
		transition: max-height 0.3s ease, opacity 0.3s ease, margin-top 0.3s ease;
		margin-top: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.weather-widget:hover .weather-details {
		max-height: 100px;
		opacity: 1;
		margin-top: 10px;
	}

	.detail-row {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.72rem;
		color: var(--footer-color);
	}

	.detail-row i {
		font-size: 0.75rem;
		color: var(--button-bg);
		width: 12px;
		text-align: center;
	}

	.updated-row { font-size: 0.65rem; opacity: 0.7; }

	.weather-loading, .weather-error, .weather-setup {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.85rem;
		color: var(--footer-color);
	}

	.weather-error { color: #dc3545; }
	.weather-error i { color: #dc3545; }
	.weather-setup:hover { color: var(--button-bg); }

	.spin { animation: spin 1s linear infinite; }

	@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

	@media (max-width: 480px) {
		.weather-widget { padding: 8px 10px; min-width: 90px; }
		.position-top-left    { top: 10px; left: 10px; }
		.position-top-right   { top: 10px; right: 10px; }
		.position-bottom-left { bottom: 10px; left: 10px; }
		.weather-icon { font-size: 1.2rem; }
		.temperature  { font-size: 0.9rem; }
		.location     { font-size: 0.65rem; max-width: 60px; }
	}
</style>
