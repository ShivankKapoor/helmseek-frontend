import { logout } from '@/lib/api/auth';
import { loadConfig, resetConfig } from './config';
import { setUnauthenticated } from './auth';

export const WAS_AUTHENTICATED_KEY = 'helm_was_authenticated';

/** Sign out on the server (best effort), then fall back to the locally cached config. */
export async function signOut() {
	try {
		await logout();
	} catch {
		/* ignore — we clear local state either way */
	}
	localStorage.removeItem(WAS_AUTHENTICATED_KEY);
	resetConfig();
	setUnauthenticated();
	loadConfig();
}
