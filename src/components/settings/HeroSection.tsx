import { config, updateAndSave } from '@/lib/state/config';
import type { UserConfig } from '@/lib/types/config';
import { SettingSection, ToggleRow } from './SettingControls';
import styles from './Settings.module.css';

const MAX_NAME_LENGTH = 30;

export function HeroSection() {
	const cfg = config.value;
	const showsClock = cfg.heroMode === 'clock' || cfg.heroMode === 'both';
	const showsGreeting = cfg.heroMode === 'greeting' || cfg.heroMode === 'both';

	return (
		<SettingSection title="Hero Widget">
			<div class={styles.widgetManager}>
				<ToggleRow
					label="Enable Hero Widget"
					checked={cfg.heroEnabled}
					onChange={(heroEnabled) => updateAndSave({ heroEnabled })}
				/>

				{cfg.heroEnabled && (
					<div class={styles.widgetOptions}>
						<div class={styles.settingRow}>
							<label for="hero-mode">Display Mode</label>
							<select
								id="hero-mode"
								class={styles.settingSelect}
								value={cfg.heroMode}
								onChange={(e) => updateAndSave({ heroMode: e.currentTarget.value as UserConfig['heroMode'] })}
							>
								<option value="greeting">Time-based Greeting</option>
								<option value="clock">Digital Clock</option>
								<option value="both">Greeting + Clock</option>
								<option value="none">None (Hide Widget)</option>
							</select>
						</div>

						{showsClock && (
							<>
								<div class={styles.settingRow}>
									<label for="clock-format">Clock Format</label>
									<select
										id="clock-format"
										class={styles.settingSelect}
										value={cfg.heroClockFormat}
										onChange={(e) =>
											updateAndSave({ heroClockFormat: e.currentTarget.value as UserConfig['heroClockFormat'] })
										}
									>
										<option value="12h">12 Hour (AM/PM)</option>
										<option value="24h">24 Hour</option>
									</select>
								</div>
								<ToggleRow
									label="Show Seconds"
									checked={cfg.heroShowSeconds}
									onChange={(heroShowSeconds) => updateAndSave({ heroShowSeconds })}
								/>
							</>
						)}

						{showsGreeting && (
							<div class={styles.settingRow}>
								<label for="greeting-name">Custom Name (optional)</label>
								<input
									id="greeting-name"
									type="text"
									class={styles.settingInput}
									value={cfg.heroGreetingName}
									placeholder="Leave blank to use username"
									maxLength={MAX_NAME_LENGTH}
									onChange={(e) => updateAndSave({ heroGreetingName: e.currentTarget.value })}
								/>
								<small class={styles.settingHint}>Custom name for greeting (e.g., "Good Morning, Alex")</small>
							</div>
						)}
					</div>
				)}
			</div>
		</SettingSection>
	);
}
