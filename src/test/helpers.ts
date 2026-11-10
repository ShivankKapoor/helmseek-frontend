import { DEFAULT_CONFIG, type UserConfig } from '@/lib/types/config';
import { config, resetConfig } from '@/lib/state/config';
import { checking, setUnauthenticated } from '@/lib/state/auth';
import { settingsOpen } from '@/lib/state/settingsUi';
import { toasts } from '@/lib/state/toast';

/** Puts the app back in its just-loaded, signed-out state. Call from `beforeEach`. */
export function resetAppState() {
	resetConfig();
	setUnauthenticated();
	checking.value = true;
	settingsOpen.value = false;
	toasts.value = [];
}

/** Overrides parts of the config without touching storage or the server. */
export function setConfig(partial: Partial<UserConfig>) {
	config.value = { ...DEFAULT_CONFIG, ...partial };
}

export function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}
