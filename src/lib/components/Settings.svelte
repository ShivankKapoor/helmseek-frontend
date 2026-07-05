<script lang="ts">
	import { configState } from '$lib/state/config.svelte';
	import { authState } from '$lib/state/auth.svelte';
	import { settingsUiState } from '$lib/state/settings.svelte';
	import { saveConfig } from '$lib/api/config';
	import { saveWeatherCache } from '$lib/api/config';
	import { geocodeZip, fetchWeather } from '$lib/api/weather';
	import { logout } from '$lib/api/auth';
	import { COLOR_OPTIONS, FONT_OPTIONS, type QuickLink } from '$lib/types/config';

	let fontDropdownOpen = $state(false);
	let allFontsLoaded = $state(false);

	function loadAllFonts() {
		if (allFontsLoaded) return;
		const families = FONT_OPTIONS.map((f) => `family=${f.name.replace(/ /g, '+')}`).join('&');
		const url = `https://fonts.googleapis.com/css2?${families}&display=swap`;
		let link = document.getElementById('google-fonts-all') as HTMLLinkElement | null;
		if (!link) {
			link = document.createElement('link');
			link.id = 'google-fonts-all';
			link.rel = 'stylesheet';
			document.head.appendChild(link);
		}
		link.href = url;
		allFontsLoaded = true;
	}

	// Weather
	let zipInput = $state('');
	let isValidatingWeather = $state(false);
	let weatherValidationMessage = $state('');
	let weatherValidationType = $state<'success' | 'error'>('success');

	// Quick links
	type LinkForm = { text: string; url: string; corner: QuickLink['corner'] };
	let showLinkModal = $state(false);
	let editingLink = $state<QuickLink | null>(null);
	let linkForm = $state<LinkForm>({ text: '', url: '', corner: 'top-right' });

	// Auth actions
	let isSyncing = $state(false);
	let syncMessage = $state('');
	let syncMessageType = $state<'success' | 'error'>('success');
	let isLoggingOut = $state(false);

	const POSITIONS = [
		{ value: 'top-left'    as const, label: 'Top Left',     short: 'TL', icon: 'bi bi-arrow-up-left'    },
		{ value: 'top-right'   as const, label: 'Top Right',    short: 'TR', icon: 'bi bi-arrow-up-right'   },
		{ value: 'bottom-left' as const, label: 'Bottom Left',  short: 'BL', icon: 'bi bi-arrow-down-left'  },
	];

	function cfg<K extends keyof typeof configState.config>(k: K) {
		return configState.config[k];
	}

	async function update(partial: Partial<typeof configState.config>) {
		configState.update(partial);
		if (authState.authenticated) saveConfig(configState.config);
	}

	function openSettings() { settingsUiState.show(); zipInput = cfg('weatherZip'); loadAllFonts(); }
	function closeSettings() { settingsUiState.hide(); fontDropdownOpen = false; }

	function handleBackdropClick(e: MouseEvent) {
		if (fontDropdownOpen) { fontDropdownOpen = false; e.stopPropagation(); return; }
		closeSettings();
	}

	async function saveLocation() {
		if (!zipInput.trim()) return;
		isValidatingWeather = true;
		weatherValidationMessage = '';
		try {
			const geo = await geocodeZip(zipInput);
			configState.update({ weatherZip: zipInput, weatherCity: geo.city, weatherLat: geo.lat, weatherLng: geo.lng });
			const w = await fetchWeather(geo.lat, geo.lng);
			const cache = {
				cachedTemperature: w.temperature, cachedWeatherCode: w.weatherCode,
				cachedWindDirection: w.windDirection, cachedWindSpeed: w.windSpeed,
				cachedWeatherDescription: w.description, cachedIsDay: w.isDay
			};
			configState.update({ ...cache, lastWeatherUpdate: new Date().toISOString() });
			if (authState.authenticated) { saveConfig(configState.config); saveWeatherCache(cache); }
			weatherValidationMessage = `Location set to ${geo.city}`;
			weatherValidationType = 'success';
		} catch {
			weatherValidationMessage = 'Location not found. Try a different zip code.';
			weatherValidationType = 'error';
		} finally {
			isValidatingWeather = false;
		}
	}

	function addNewQuickLink() {
		editingLink = null;
		linkForm = { text: '', url: '', corner: 'top-right' };
		showLinkModal = true;
	}

	function editQuickLink(link: QuickLink) {
		editingLink = link;
		linkForm = { text: link.text, url: link.url, corner: link.corner };
		showLinkModal = true;
	}

	function removeQuickLink(id: string) {
		update({ quickLinks: cfg('quickLinks').filter((l) => l.id !== id) });
	}

	function saveLinkModal() {
		const links = cfg('quickLinks');
		if (editingLink) {
			update({ quickLinks: links.map((l) => l.id === editingLink!.id ? { ...l, ...linkForm } : l) });
		} else {
			const id = `ql_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
			update({ quickLinks: [...links, { ...linkForm, id, enabled: true, order: links.length }] });
		}
		showLinkModal = false;
	}

	function formatCorner(c: string) {
		return c.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
	}

	async function syncToServer() {
		isSyncing = true; syncMessage = '';
		try {
			await saveConfig(configState.config);
			syncMessage = 'Configuration synced to server successfully!';
			syncMessageType = 'success';
		} catch {
			syncMessage = 'Failed to sync configuration to server.';
			syncMessageType = 'error';
		} finally {
			isSyncing = false;
			setTimeout(() => { syncMessage = ''; }, 3000);
		}
	}

	async function doLogout() {
		isLoggingOut = true;
		try { await logout(); } catch { /* ignore */ }
		localStorage.removeItem('helm_was_authenticated');
		configState.reset();
		authState.setUnauthenticated();
		configState.load();
		closeSettings();
		isLoggingOut = false;
	}

	function hasWeatherChanges() {
		return zipInput !== cfg('weatherZip');
	}
</script>

<!-- Settings trigger button -->
<button class="settings-trigger" onclick={openSettings} title="Settings">
	<i class="bi bi-gear-fill"></i>
</button>

<!-- Settings modal -->
{#if settingsUiState.open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="settings-backdrop" onclick={closeSettings} onkeydown={(e) => e.key === 'Escape' && closeSettings()}>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="settings-modal" onclick={(e) => { e.stopPropagation(); if (fontDropdownOpen) fontDropdownOpen = false; }}>
			<div class="settings-header">
				<h3>Settings</h3>
				<button class="close-btn" onclick={closeSettings}><i class="bi bi-x-lg"></i></button>
			</div>

			<div class="settings-content">

				<!-- Theme -->
				<div class="setting-section">
					<label>Theme</label>
					<button class="theme-toggle-btn" onclick={() => update({ themeMode: cfg('themeMode') === 'light' ? 'dark' : 'light' })}>
						<i class={cfg('themeMode') === 'dark' ? 'bi bi-moon-fill' : 'bi bi-sun-fill'}></i>
						<span>{cfg('themeMode') === 'dark' ? 'Dark' : 'Light'} Mode</span>
					</button>
				</div>

				<!-- Color -->
				<div class="setting-section">
					<label>Color Scheme</label>
					<select
						class="color-selector-dropdown"
						value={cfg('selectedColor')}
						onchange={(e) => update({ selectedColor: e.currentTarget.value })}
					>
						{#each COLOR_OPTIONS as opt}
							<option value={opt.value}>{opt.name}</option>
						{/each}
					</select>
				</div>

				<!-- Font -->
				<div class="setting-section">
					<label>Font</label>
					<div class="font-dropdown" class:open={fontDropdownOpen} onclick={(e) => e.stopPropagation()}>
						<button
							type="button"
							class="font-dropdown-trigger"
							onclick={() => (fontDropdownOpen = !fontDropdownOpen)}
							style="font-family: '{cfg('fontFamily')}', sans-serif"
						>
							{cfg('fontFamily')}
							<i class="bi bi-chevron-down font-chevron"></i>
						</button>
						{#if fontDropdownOpen}
							<ul class="font-dropdown-list">
								{#each FONT_OPTIONS as opt}
									<li>
										<button
											type="button"
											class="font-dropdown-option"
											class:selected={cfg('fontFamily') === opt.name}
											style="font-family: '{opt.name}', {opt.fallback}"
											onclick={() => { update({ fontFamily: opt.name }); fontDropdownOpen = false; }}
										>{opt.name}</button>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>

				<!-- Hero Widget -->
				<div class="setting-section">
					<label>Hero Widget</label>
					<div class="hero-widget-manager">
						<label class="toggle-row">
							<input type="checkbox" checked={cfg('heroEnabled')} onchange={(e) => update({ heroEnabled: e.currentTarget.checked })} />
							<span>Enable Hero Widget</span>
						</label>
						{#if cfg('heroEnabled')}
							<div class="hero-widget-options">
								<div class="setting-row">
									<label for="hero-mode">Display Mode</label>
									<select id="hero-mode" class="setting-select" value={cfg('heroMode')}
										onchange={(e) => update({ heroMode: e.currentTarget.value as any })}>
										<option value="greeting">Time-based Greeting</option>
										<option value="clock">Digital Clock</option>
										<option value="both">Greeting + Clock</option>
										<option value="none">None (Hide Widget)</option>
									</select>
								</div>
								{#if cfg('heroMode') === 'clock' || cfg('heroMode') === 'both'}
									<div class="setting-row">
										<label for="clock-format">Clock Format</label>
										<select id="clock-format" class="setting-select" value={cfg('heroClockFormat')}
											onchange={(e) => update({ heroClockFormat: e.currentTarget.value as any })}>
											<option value="12h">12 Hour (AM/PM)</option>
											<option value="24h">24 Hour</option>
										</select>
									</div>
									<label class="toggle-row">
										<input type="checkbox" checked={cfg('heroShowSeconds')}
											onchange={(e) => update({ heroShowSeconds: e.currentTarget.checked })} />
										<span>Show Seconds</span>
									</label>
								{/if}
								{#if cfg('heroMode') === 'greeting' || cfg('heroMode') === 'both'}
									<div class="setting-row">
										<label for="greeting-name">Custom Name (optional)</label>
										<input id="greeting-name" type="text" class="setting-input"
											value={cfg('heroGreetingName')}
											placeholder="Leave blank to use username"
											maxlength="30"
											onchange={(e) => update({ heroGreetingName: e.currentTarget.value })} />
										<small class="setting-hint">Custom name for greeting (e.g., "Good Morning, Alex")</small>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>

				<!-- Weather Widget -->
				<div class="setting-section">
					<label>Weather Widget</label>
					<div class="weather-widget-manager">
						<label class="toggle-row">
							<input type="checkbox" checked={cfg('weatherEnabled')}
								onchange={(e) => update({ weatherEnabled: e.currentTarget.checked })} />
							<span>Enable Weather Widget</span>
						</label>
						{#if cfg('weatherEnabled')}
							<div class="weather-widget-options">
								<div class="setting-row">
									<label for="weather-zipcode">Zip Code</label>
									<div class="input-with-button">
										<input id="weather-zipcode" type="text" class="setting-input"
											bind:value={zipInput}
											placeholder="Enter zip code (e.g., 90210)"
											maxlength="10" />
										<button type="button" class="save-location-btn"
											onclick={saveLocation}
											disabled={!zipInput.trim() || isValidatingWeather || !hasWeatherChanges()}>
											{#if isValidatingWeather}
												<i class="bi bi-arrow-clockwise spin"></i> <span>Saving...</span>
											{:else}
												<i class="bi bi-geo-alt"></i> <span>Save Location</span>
											{/if}
										</button>
									</div>
									<small class="setting-hint">Enter your zip code and click "Save Location" to get local weather</small>
									{#if weatherValidationMessage}
										<div class="validation-message {weatherValidationType}">{weatherValidationMessage}</div>
									{/if}
								</div>
								{#if cfg('weatherCity')}
									<div class="setting-row">
										<label>Location</label>
										<div class="location-info">
											<i class="bi bi-geo-alt"></i>
											<span>{cfg('weatherCity')}</span>
										</div>
									</div>
								{/if}
								<div class="setting-row">
									<label>Widget Position</label>
									<div class="weather-position-grid">
										{#each POSITIONS as pos}
											<button type="button"
												class="weather-position-btn {cfg('weatherCorner') === pos.value ? 'active' : ''}"
												onclick={() => update({ weatherCorner: pos.value })}
												title={pos.label}>
												<i class={pos.icon}></i>
												<span>{pos.short}</span>
											</button>
										{/each}
										<div class="weather-reserved-position">
											<i class="bi bi-gear-fill"></i>
											<span>Reserved</span>
											<small>Settings</small>
										</div>
									</div>
									<small class="setting-hint">Choose where the weather widget appears on your screen</small>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Quick Links -->
				<div class="setting-section">
					<label>Quick Links</label>
					<div class="quick-links-manager">
						<label class="toggle-row">
							<input type="checkbox" checked={cfg('quickLinksEnabled')}
								onchange={(e) => update({ quickLinksEnabled: e.currentTarget.checked })} />
							<span>Enable Quick Links</span>
						</label>
						{#if cfg('quickLinksEnabled')}
							<div class="quick-links-list">
								{#if cfg('quickLinks').length === 0}
									<div class="no-links-message"><span>No quick links configured</span></div>
								{:else}
									{#each cfg('quickLinks') as link (link.id)}
										<div class="quick-link-item">
											<div class="link-info">
												<span class="link-text">{link.text}</span>
												<span class="link-corner">{formatCorner(link.corner)}</span>
											</div>
											<div class="link-actions">
												<button class="action-btn edit-btn" onclick={() => editQuickLink(link)} title="Edit">
													<i class="bi bi-pencil"></i>
												</button>
												<button class="action-btn delete-btn" onclick={() => removeQuickLink(link.id)} title="Delete">
													<i class="bi bi-trash"></i>
												</button>
											</div>
										</div>
									{/each}
								{/if}
								{#if cfg('quickLinks').length < 10}
									<button class="add-link-btn" onclick={addNewQuickLink}>
										<i class="bi bi-plus"></i> Add Quick Link
									</button>
								{:else}
									<div class="max-links-message">Maximum 10 quick links reached</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>

				<!-- Quote of the Day (authenticated only — the endpoint requires a session) -->
				{#if authState.authenticated}
					<div class="setting-section">
						<label>Quote of the Day</label>
						<div class="quote-widget-manager">
							<label class="toggle-row">
								<input type="checkbox" checked={cfg('motdEnabled')}
									onchange={(e) => update({ motdEnabled: e.currentTarget.checked })} />
								<span>Enable Quote of the Day</span>
							</label>
						</div>
					</div>
				{/if}

				<!-- Sync + Logout (authenticated only) -->
				{#if authState.authenticated}
					<div class="setting-section">
						<label>Configuration Sync</label>
						<div class="sync-manager">
							<p class="sync-description">Sync your configuration with the server to access it across devices.</p>
							<div class="sync-actions">
								<button class="sync-btn sync-to-server" onclick={syncToServer} disabled={isSyncing}>
									<i class="bi {isSyncing ? 'bi-arrow-clockwise sync-spinning' : 'bi-cloud-upload'}"></i>
									{isSyncing ? 'Syncing...' : 'Sync to Server'}
								</button>
							</div>
							{#if syncMessage}
								<div class="sync-message {syncMessageType}">{syncMessage}</div>
							{/if}
						</div>
					</div>

					<div class="setting-section">
						<label>Account</label>
						<div class="account-manager">
							<div class="account-actions">
								<button class="logout-btn" onclick={doLogout} disabled={isLoggingOut}>
									<i class="bi {isLoggingOut ? 'bi-arrow-clockwise sync-spinning' : 'bi-box-arrow-right'}"></i>
									{isLoggingOut ? 'Signing out...' : 'Sign Out'}
								</button>
							</div>
						</div>
					</div>
				{/if}

			</div>
		</div>
	</div>
{/if}

<!-- Quick Link Add/Edit Modal -->
{#if showLinkModal}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="quick-link-settings-backdrop" onclick={() => { showLinkModal = false; }}
		onkeydown={(e) => e.key === 'Escape' && (showLinkModal = false)}>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="quick-link-settings-modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>{editingLink ? 'Edit Quick Link' : 'Add Quick Link'}</h3>
				<button class="close-btn" onclick={() => { showLinkModal = false; }}><i class="bi bi-x-lg"></i></button>
			</div>
			<div class="modal-content">
				<div class="setting-item">
					<label>Link Text</label>
					<input type="text" bind:value={linkForm.text} placeholder="e.g., Documentation, GitHub" maxlength="20" />
					<small>Maximum 20 characters</small>
				</div>
				<div class="setting-item">
					<label>URL</label>
					<input type="url" bind:value={linkForm.url} placeholder="https://example.com" />
					<small>Must start with http:// or https://</small>
				</div>
				<div class="setting-item">
					<label>Position</label>
					<div class="position-grid">
						{#each POSITIONS as pos}
							<button class="position-btn {linkForm.corner === pos.value ? 'active' : ''}"
								onclick={() => { linkForm.corner = pos.value; }} title={pos.label}>
								<i class={pos.icon}></i>
								<span>{pos.short}</span>
							</button>
						{/each}
						<div class="reserved-position">
							<i class="bi bi-gear-fill"></i>
							<span>Reserved</span>
							<small>Settings</small>
						</div>
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<button class="btn-secondary" onclick={() => { showLinkModal = false; }}>Cancel</button>
				<button class="btn-primary" onclick={saveLinkModal} disabled={!linkForm.text || !linkForm.url}>
					{editingLink ? 'Update' : 'Add'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* ── Settings-specific styles (global styles in app.css) ── */

	.toggle-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-weight: 500;
		font-size: 14px;
	}

	.toggle-row input[type="checkbox"] {
		appearance: none;
		-webkit-appearance: none;
		margin: 0;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 2px solid rgba(128, 128, 128, 0.4);
		background: var(--bg-color);
		cursor: pointer;
		position: relative;
		flex-shrink: 0;
		transition: border-color 0.2s ease, background 0.2s ease;
	}

	.toggle-row input[type="checkbox"]:hover { border-color: var(--button-bg); }

	.toggle-row input[type="checkbox"]:checked {
		background: var(--button-bg);
		border-color: var(--button-bg);
	}

	.toggle-row input[type="checkbox"]:checked::after {
		content: '';
		position: absolute;
		inset: 0;
		margin: auto;
		width: 4px;
		height: 8px;
		border: solid #fff;
		border-width: 0 2px 2px 0;
		transform: translateY(-1px) rotate(45deg);
	}

	.toggle-row input[type="checkbox"]:focus-visible {
		outline: 2px solid var(--button-bg);
		outline-offset: 2px;
	}

	.hero-widget-manager, .weather-widget-manager, .quick-links-manager, .quote-widget-manager, .sync-manager, .account-manager {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.hero-widget-options, .weather-widget-options {
		margin-left: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.setting-row {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.setting-row > label { font-size: 13px; font-weight: 500; color: var(--text-color); }

	.setting-select, .setting-input {
		padding: 8px 10px;
		border: 1px solid rgba(128,128,128,0.3);
		border-radius: 6px;
		background: var(--bg-color);
		color: var(--text-color);
		font-family: var(--font-family);
		font-size: 13px;
		outline: none;
		transition: border-color 0.2s;
	}

	.setting-select:focus, .setting-input:focus { border-color: var(--button-bg); }

	.setting-hint { font-size: 12px; color: var(--footer-color); }

	.input-with-button { display: flex; gap: 8px; align-items: center; }
	.input-with-button .setting-input { flex: 1; }

	.save-location-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 12px;
		background: var(--button-bg);
		color: #fff;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-family: var(--font-family);
		font-size: 13px;
		white-space: nowrap;
		transition: background 0.2s;
	}

	.save-location-btn:hover:not(:disabled) { background: var(--button-hover); }
	.save-location-btn:disabled { opacity: 0.6; cursor: not-allowed; }

	.validation-message { padding: 6px 10px; border-radius: 4px; font-size: 12px; margin-top: 4px; }
	.validation-message.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
	.validation-message.error   { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

	.location-info { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-color); }

	.weather-position-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		margin-top: 4px;
	}

	.weather-position-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 10px 8px;
		border: 2px solid rgba(128,128,128,0.25);
		border-radius: 8px;
		background: var(--bg-color);
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.8rem;
		color: var(--text-color);
		font-family: var(--font-family);
	}

	.weather-position-btn:hover { border-color: var(--button-bg); background: var(--input-bg); }
	.weather-position-btn.active { border-color: var(--button-bg); background: var(--button-bg); color: #fff; }
	.weather-position-btn i { font-size: 1.1rem; }

	.weather-reserved-position {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 10px 8px;
		border: 2px solid rgba(128,128,128,0.2);
		border-radius: 8px;
		color: var(--footer-color);
		font-size: 0.8rem;
		opacity: 0.6;
		font-family: var(--font-family);
	}

	.weather-reserved-position small { font-size: 0.7rem; }

	/* Quick Links list */
	.quick-links-list {
		margin-left: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.quick-link-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 12px;
		background: var(--bg-color);
		border: 1px solid rgba(128,128,128,0.2);
		border-radius: 6px;
	}

	.link-info { display: flex; flex-direction: column; gap: 2px; }
	.link-text { font-weight: 500; color: var(--text-color); font-size: 14px; }
	.link-corner { font-size: 0.8rem; color: var(--footer-color); }
	.link-actions { display: flex; gap: 4px; }

	.action-btn {
		padding: 4px 6px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.8rem;
		transition: all 0.2s ease;
	}

	.edit-btn   { background: var(--button-bg); color: white; }
	.edit-btn:hover   { background: var(--button-hover); }
	.delete-btn { background: #dc3545; color: white; }
	.delete-btn:hover { background: #c82333; }

	.add-link-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 10px;
		background: var(--bg-color);
		border: 2px dashed rgba(128,128,128,0.3);
		border-radius: 6px;
		cursor: pointer;
		color: var(--footer-color);
		font-size: 0.9rem;
		font-family: var(--font-family);
		transition: all 0.2s ease;
	}

	.add-link-btn:hover { border-color: var(--button-bg); color: var(--button-bg); }

	.no-links-message, .max-links-message {
		text-align: center;
		color: var(--footer-color);
		font-style: italic;
		padding: 20px;
		font-size: 13px;
	}

	/* Sync */
	.sync-description, .account-description {
		margin: 0;
		color: var(--footer-color);
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.sync-actions, .account-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

	.sync-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 8px 16px;
		border: 1px solid rgba(128,128,128,0.3);
		border-radius: 6px;
		background: var(--bg-color);
		color: var(--text-color);
		cursor: pointer;
		font-size: 0.9rem;
		font-family: var(--font-family);
		transition: all 0.2s ease;
		min-width: 140px;
		justify-content: center;
	}

	.sync-btn:disabled { opacity: 0.6; cursor: not-allowed; }
	.sync-to-server { border-color: #28a745; }
	.sync-to-server:hover:not(:disabled) { background: #28a745; color: white; }
	.sync-spinning { animation: spin 1s linear infinite; }

	.sync-message { padding: 8px 12px; border-radius: 4px; font-size: 0.9rem; text-align: center; }
	.sync-message.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
	.sync-message.error   { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

	.logout-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 8px 16px;
		border: 1px solid #dc3545;
		border-radius: 6px;
		background: #dc3545;
		color: white;
		cursor: pointer;
		font-size: 0.9rem;
		font-family: var(--font-family);
		transition: all 0.2s ease;
		min-width: 120px;
		justify-content: center;
	}

	.logout-btn:hover:not(:disabled) { background: #c82333; }
	.logout-btn:disabled { opacity: 0.6; cursor: not-allowed; }

	@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

	/* Quick Link Add/Edit Modal */
	.quick-link-settings-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.5);
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.quick-link-settings-modal {
		background: var(--input-bg);
		border-radius: 12px;
		box-shadow: 0 20px 60px rgba(0,0,0,0.3);
		max-width: 500px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		color: var(--text-color);
		animation: slideIn 0.3s ease-out;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px 24px 16px;
		border-bottom: 1px solid rgba(128,128,128,0.2);
	}

	.modal-header h3 { margin: 0; font-size: 1.2rem; font-weight: 600; }

	.modal-content {
		padding: 20px 24px;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.setting-item { display: flex; flex-direction: column; gap: 0.5rem; }
	.setting-item > label { font-weight: 600; font-size: 0.9rem; }

	.setting-item input {
		padding: 10px 12px;
		border: 1px solid rgba(128,128,128,0.3);
		border-radius: 6px;
		font-size: 0.9rem;
		background: var(--bg-color);
		color: var(--text-color);
		font-family: var(--font-family);
		outline: none;
		transition: border-color 0.2s;
	}

	.setting-item input:focus { border-color: var(--button-bg); box-shadow: 0 0 0 3px rgba(26,115,232,0.1); }
	.setting-item small { color: var(--footer-color); font-size: 0.8rem; }

	.position-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

	.position-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 12px 8px;
		border: 2px solid rgba(128,128,128,0.25);
		border-radius: 8px;
		background: var(--bg-color);
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.8rem;
		color: var(--text-color);
		font-family: var(--font-family);
	}

	.position-btn:hover { border-color: var(--button-bg); }
	.position-btn.active { border-color: var(--button-bg); background: var(--button-bg); color: white; }
	.position-btn i { font-size: 1.2rem; }

	.reserved-position {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 12px 8px;
		border: 2px solid rgba(128,128,128,0.15);
		border-radius: 8px;
		color: var(--footer-color);
		font-size: 0.8rem;
		opacity: 0.6;
		font-family: var(--font-family);
	}

	.reserved-position small { font-size: 0.7rem; }

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding: 16px 24px 20px;
		border-top: 1px solid rgba(128,128,128,0.2);
	}

	.btn-secondary {
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		background: transparent;
		border: 1px solid rgba(128,128,128,0.3);
		color: var(--text-color);
		font-family: var(--font-family);
		transition: all 0.2s ease;
	}

	.btn-secondary:hover { background: var(--bg-color); }

	.btn-primary {
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		background: var(--button-bg);
		border: 1px solid var(--button-bg);
		color: white;
		font-family: var(--font-family);
		transition: all 0.2s ease;
	}

	.btn-primary:hover:not(:disabled) { background: var(--button-hover); }
	.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

	.font-dropdown { position: relative; width: 100%; }

	.font-dropdown-trigger {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid rgba(128, 128, 128, 0.3);
		border-radius: 6px;
		background: var(--input-bg);
		color: var(--text-color);
		font-size: 14px;
		cursor: pointer;
		outline: none;
		display: flex;
		justify-content: space-between;
		align-items: center;
		text-align: left;
	}

	.font-dropdown-trigger:focus,
	.font-dropdown.open .font-dropdown-trigger {
		border-color: var(--button-bg);
		box-shadow: 0 0 0 2px rgba(var(--button-bg-rgb), 0.2);
	}

	.font-chevron {
		font-size: 11px;
		opacity: 0.6;
		transition: transform 0.15s;
	}

	.font-dropdown.open .font-chevron { transform: rotate(180deg); }

	.font-dropdown-list {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		background: var(--input-bg);
		border: 1px solid rgba(128, 128, 128, 0.3);
		border-radius: 6px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
		z-index: 100;
		list-style: none;
		max-height: 220px;
		overflow-y: auto;
		padding: 4px 0;
	}

	.font-dropdown-list::-webkit-scrollbar { width: 6px; }
	.font-dropdown-list::-webkit-scrollbar-track { background: transparent; }
	.font-dropdown-list::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.3); border-radius: 3px; }

	.font-dropdown-option {
		width: 100%;
		padding: 9px 12px;
		border: none;
		background: none;
		color: var(--text-color);
		font-size: 14px;
		cursor: pointer;
		text-align: left;
		display: block;
	}

	.font-dropdown-option:hover { background: rgba(128, 128, 128, 0.12); }
	.font-dropdown-option.selected { color: var(--button-bg); font-weight: 600; }
</style>
