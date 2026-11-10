import { signal } from '@preact/signals';
import { DEFAULT_CONFIG, type UserConfig } from '@/lib/types/config';
import { saveConfig } from '@/lib/api/config';
import { authenticated } from './auth';

const STORAGE_KEY = 'helm_config';

export const config = signal<UserConfig>({ ...DEFAULT_CONFIG });
export const serverSynced = signal(false);

function persist() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value));
}

/** Load the locally cached config (used before, or without, a server session). */
export function loadConfig() {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return;
	try {
		const parsed = JSON.parse(raw);
		const clean = Object.fromEntries(
			Object.entries(parsed).filter(([, v]) => v !== null && v !== undefined)
		);
		config.value = { ...DEFAULT_CONFIG, ...clean };
	} catch {
		/* corrupt storage — keep defaults */
	}
}

export function updateConfig(partial: Partial<UserConfig>) {
	config.value = { ...config.value, ...partial };
	persist();
}

/** Update locally, then push to the server when signed in (fire and forget). */
export function updateAndSave(partial: Partial<UserConfig>) {
	updateConfig(partial);
	if (authenticated.value) saveConfig(config.value).catch(() => {});
}

/** Replace with the server's copy and mark as synced. */
export function replaceConfig(incoming: UserConfig) {
	config.value = { ...DEFAULT_CONFIG, ...incoming };
	serverSynced.value = true;
	persist();
}

export function resetConfig() {
	config.value = { ...DEFAULT_CONFIG };
	serverSynced.value = false;
	localStorage.removeItem(STORAGE_KEY);
}
