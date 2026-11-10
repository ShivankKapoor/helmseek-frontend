import { authenticated } from '@/lib/state/auth';
import { isBackdropClick } from '@/lib/utils/dom';
import { config, updateAndSave } from '@/lib/state/config';
import { closeSettings, openSettings, settingsOpen } from '@/lib/state/settingsUi';
import { COLOR_OPTIONS } from '@/lib/types/config';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { AccountSection, QuoteSection, SyncSection } from './AccountSections';
import { FontPicker } from './FontPicker';
import { HeroSection } from './HeroSection';
import { QuickLinksSection } from './QuickLinksSection';
import { SettingSection } from './SettingControls';
import { WeatherSection } from './WeatherSection';

/** The gear button plus the settings modal it opens. */
export function Settings() {
	return (
		<>
			<button class="settings-trigger" onClick={openSettings} title="Settings" aria-label="Settings">
				<i class="bi bi-gear-fill" aria-hidden="true" />
			</button>
			{settingsOpen.value && <SettingsModal />}
		</>
	);
}

function SettingsModal() {
	const cfg = config.value;
	const isSignedIn = authenticated.value;

	useEscapeKey(true, closeSettings);

	return (
		<div class="settings-backdrop" onClick={(event) => isBackdropClick(event) && closeSettings()}>
			<div class="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
				<div class="settings-header">
					<h3 id="settings-title">Settings</h3>
					<button class="close-btn" onClick={closeSettings} aria-label="Close settings">
						<i class="bi bi-x-lg" aria-hidden="true" />
					</button>
				</div>

				<div class="settings-content">
					<SettingSection title="Theme">
						<button
							class="theme-toggle-btn"
							onClick={() => updateAndSave({ themeMode: cfg.themeMode === 'light' ? 'dark' : 'light' })}
						>
							<i class={cfg.themeMode === 'dark' ? 'bi bi-moon-fill' : 'bi bi-sun-fill'} aria-hidden="true" />
							<span>{cfg.themeMode === 'dark' ? 'Dark' : 'Light'} Mode</span>
						</button>
					</SettingSection>

					<SettingSection title="Color Scheme">
						<select
							class="color-selector-dropdown"
							aria-label="Color scheme"
							value={cfg.selectedColor}
							onChange={(e) => updateAndSave({ selectedColor: e.currentTarget.value })}
						>
							{COLOR_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.name}
								</option>
							))}
						</select>
					</SettingSection>

					<SettingSection title="Font">
						<FontPicker />
					</SettingSection>

					<HeroSection />
					<WeatherSection />
					<QuickLinksSection />

					{isSignedIn && (
						<>
							<QuoteSection />
							<SyncSection />
							<AccountSection onSignedOut={closeSettings} />
						</>
					)}
				</div>
			</div>
		</div>
	);
}
