import { useEffect } from 'preact/hooks';
import { config } from '@/lib/state/config';
import { syncWeather, weatherFailed, weatherLoading } from '@/lib/state/weather';
import { cx } from '@/lib/utils/cx';
import {
	formatTimeAgo,
	isWeatherStale,
	weatherIconClass,
	windDegreesToCompass
} from '@/lib/utils/weather';
import styles from './WeatherWidget.module.css';

const LONG_NAME_THRESHOLDS = [
	{ minLength: 21, className: styles.extremelyLongName },
	{ minLength: 16, className: styles.veryLongName },
	{ minLength: 11, className: styles.longName }
];

/** Shrinks the city label as the name gets longer so it still fits the widget. */
function cityClassName(city: string): string {
	const match = LONG_NAME_THRESHOLDS.find(({ minLength }) => city.length >= minLength);
	return cx(styles.location, match?.className);
}

/** Refreshes the cached weather when it's stale. */
function useWeatherRefresh() {
	const { weatherEnabled, weatherLat, weatherLng } = config.value;

	useEffect(() => {
		const hasLocation = weatherLat !== 0 || weatherLng !== 0;
		if (!weatherEnabled || !hasLocation || !isWeatherStale(config.value.lastWeatherUpdate)) return;
		syncWeather();
	}, [weatherEnabled, weatherLat, weatherLng]);

	return { loading: weatherLoading.value, failed: weatherFailed.value };
}

export function WeatherWidget() {
	const cfg = config.value;
	const { loading, failed } = useWeatherRefresh();

	if (!cfg.weatherEnabled) return null;

	return (
		<div class={cx(styles.weatherWidget, styles[`position-${cfg.weatherCorner}`])} data-context-menu="weather">
			{loading ? (
				<div class={styles.weatherLoading}>
					<i class="bi bi-arrow-clockwise spin" aria-hidden="true" />
					<span>Loading...</span>
				</div>
			) : failed ? (
				<div class={styles.weatherError}>
					<i class="bi bi-exclamation-triangle" aria-hidden="true" />
					<span>Weather unavailable</span>
				</div>
			) : cfg.cachedTemperature !== null ? (
				<>
					<div class={styles.weatherContent}>
						<div class={styles.weatherIcon}>
							<i class={weatherIconClass(cfg.cachedWeatherCode, cfg.cachedIsDay)} aria-hidden="true" />
						</div>
						<div class={styles.weatherInfo}>
							<div class={styles.temperature}>{cfg.cachedTemperature}°F</div>
							<div class={cityClassName(cfg.weatherCity)}>{cfg.weatherCity}</div>
						</div>
					</div>
					<WeatherDetails />
				</>
			) : (
				<div class={styles.weatherSetup}>
					<i class="bi bi-geo-alt" aria-hidden="true" />
					<span>Setup weather</span>
				</div>
			)}
		</div>
	);
}

/** The extra rows revealed on hover. */
function WeatherDetails() {
	const cfg = config.value;
	const compass = cfg.cachedWindDirection !== null ? windDegreesToCompass(cfg.cachedWindDirection) : '';

	return (
		<div class={styles.weatherDetails}>
			{cfg.cachedWeatherDescription && (
				<DetailRow icon="bi-cloud" text={cfg.cachedWeatherDescription} />
			)}
			{cfg.cachedWindSpeed !== null && (
				<DetailRow icon="bi-wind" text={`${cfg.cachedWindSpeed} mph ${compass}`} />
			)}
			{cfg.cachedIsDay !== null && (
				<DetailRow icon={cfg.cachedIsDay ? 'bi-sun' : 'bi-moon'} text={cfg.cachedIsDay ? 'Daytime' : 'Nighttime'} />
			)}
			{cfg.lastWeatherUpdate && (
				<DetailRow icon="bi-clock" text={`Updated ${formatTimeAgo(cfg.lastWeatherUpdate)}`} isMuted />
			)}
		</div>
	);
}

function DetailRow({ icon, text, isMuted = false }: { icon: string; text: string; isMuted?: boolean }) {
	return (
		<div class={cx(styles.detailRow, isMuted && styles.updatedRow)}>
			<i class={`bi ${icon}`} aria-hidden="true" />
			<span>{text}</span>
		</div>
	);
}
