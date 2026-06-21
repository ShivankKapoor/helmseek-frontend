import { browser } from '$app/environment';
import { DEFAULT_CONFIG, type UserConfig } from '$lib/types/config';

const STORAGE_KEY = 'helm_config';

function createConfigState() {
	let config = $state<UserConfig>({ ...DEFAULT_CONFIG });
	let serverSynced = $state(false);

	function load() {
		if (!browser) return;
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return;
		try {
			const parsed = JSON.parse(raw);
			const clean = Object.fromEntries(
				Object.entries(parsed).filter(([, v]) => v !== null && v !== undefined)
			);
			config = { ...DEFAULT_CONFIG, ...clean };
		} catch { /* corrupt storage — use defaults */ }
	}

	function update(partial: Partial<UserConfig>) {
		config = { ...config, ...partial };
		persist();
	}

	// Replaces config with server data and marks as synced
	function replace(incoming: UserConfig) {
		config = { ...DEFAULT_CONFIG, ...incoming };
		serverSynced = true;
		persist();
	}

	function reset() {
		config = { ...DEFAULT_CONFIG };
		serverSynced = false;
		if (browser) localStorage.removeItem(STORAGE_KEY);
	}

	function persist() {
		if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
	}

	return {
		get config() { return config; },
		get serverSynced() { return serverSynced; },
		load,
		update,
		replace,
		reset
	};
}

export const configState = createConfigState();
