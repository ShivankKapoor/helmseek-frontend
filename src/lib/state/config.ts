import { signal } from '@preact/signals';
import { DEFAULT_CONFIG, type UserConfig } from '@/lib/types/config';
import { saveConfig } from '@/lib/api/config';
import { ApiError } from '@/lib/api/client';
import { authenticated } from './auth';
import { showToast, toasts } from './toast';

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

const SAVE_FAILED_MESSAGE = "Couldn't save your changes to the server";

/** Tell the user a background save failed, otherwise their settings silently stop syncing. */
function reportSaveFailure(error: unknown) {
	// A 401 is already reported as an expired session.
	if (error instanceof ApiError && error.status === 401) return;
	// Several quick changes can fail in a row; one message is enough.
	if (toasts.value.some((toast) => toast.message === SAVE_FAILED_MESSAGE)) return;
	showToast(SAVE_FAILED_MESSAGE, 'error');
}

/** Update locally, then push to the server when signed in (in the background). */
export function updateAndSave(partial: Partial<UserConfig>) {
	updateConfig(partial);
	if (authenticated.value) saveConfig(config.value).catch(reportSaveFailure);
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
