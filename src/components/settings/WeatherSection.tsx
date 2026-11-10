import { useState } from 'preact/hooks';
import { saveConfig, saveWeatherCache } from '@/lib/api/config';
import { fetchWeather, geocodeZip } from '@/lib/api/weather';
import { authenticated } from '@/lib/state/auth';
import { config, updateAndSave, updateConfig } from '@/lib/state/config';
import { toWeatherCache } from '@/lib/utils/weather';
import { cx } from '@/lib/utils/cx';
import { CornerPicker } from './CornerPicker';
import { SettingSection, ToggleRow } from './SettingControls';
import styles from './Settings.module.css';

const MAX_ZIP_LENGTH = 10;

export function WeatherSection() {
	const cfg = config.value;

	return (
		<SettingSection title="Weather Widget">
			<div class={styles.widgetManager}>
				<ToggleRow
					label="Enable Weather Widget"
					checked={cfg.weatherEnabled}
					onChange={(weatherEnabled) => updateAndSave({ weatherEnabled })}
				/>

				{cfg.weatherEnabled && (
					<div class={styles.widgetOptions}>
						<LocationForm />

						{cfg.weatherCity && (
							<div class={styles.settingRow}>
								<label>Location</label>
								<div class={styles.locationInfo}>
									<i class="bi bi-geo-alt" aria-hidden="true" />
									<span>{cfg.weatherCity}</span>
								</div>
							</div>
						)}

						<div class={styles.settingRow}>
							<label>Widget Position</label>
							<CornerPicker
								variant="compact"
								value={cfg.weatherCorner}
								onChange={(weatherCorner) => updateAndSave({ weatherCorner })}
							/>
							<small class={styles.settingHint}>Choose where the weather widget appears on your screen</small>
						</div>
					</div>
				)}
			</div>
		</SettingSection>
	);
}

/** Looks up a ZIP code, stores the location, and fetches its first weather reading. */
function LocationForm() {
	// Starts from the saved ZIP each time the modal opens.
	const [zip, setZip] = useState(config.value.weatherZip);
	const [isSaving, setIsSaving] = useState(false);
	const [result, setResult] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

	const canSave = zip.trim() !== '' && !isSaving && zip !== config.value.weatherZip;

	async function saveLocation() {
		setIsSaving(true);
		setResult(null);
		try {
			const location = await geocodeZip(zip);
			updateConfig({
				weatherZip: zip,
				weatherCity: location.city,
				weatherLat: location.lat,
				weatherLng: location.lng
			});

			const cache = toWeatherCache(await fetchWeather(location.lat, location.lng));
			updateConfig({ ...cache, lastWeatherUpdate: new Date().toISOString() });

			if (authenticated.value) {
				// Save the config first: the backend files the weather history under the stored location.
				await saveConfig(config.value);
				saveWeatherCache(cache).catch(() => {});
			}
			setResult({ text: `Location set to ${location.city}`, type: 'success' });
		} catch {
			setResult({ text: 'Location not found. Try a different zip code.', type: 'error' });
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<div class={styles.settingRow}>
			<label for="weather-zipcode">Zip Code</label>
			<div class={styles.inputWithButton}>
				<input
					id="weather-zipcode"
					type="text"
					class={styles.settingInput}
					value={zip}
					onInput={(e) => setZip(e.currentTarget.value)}
					placeholder="Enter zip code (e.g., 90210)"
					maxLength={MAX_ZIP_LENGTH}
				/>
				<button type="button" class={styles.saveLocationBtn} onClick={saveLocation} disabled={!canSave}>
					{isSaving ? (
						<>
							<i class="bi bi-arrow-clockwise spin" aria-hidden="true" /> <span>Saving...</span>
						</>
					) : (
						<>
							<i class="bi bi-geo-alt" aria-hidden="true" /> <span>Save Location</span>
						</>
					)}
				</button>
			</div>
			<small class={styles.settingHint}>Enter your zip code and click "Save Location" to get local weather</small>
			{result && <div class={cx(styles.validationMessage, styles[result.type])}>{result.text}</div>}
		</div>
	);
}
