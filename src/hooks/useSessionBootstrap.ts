import { useEffect } from 'preact/hooks';
import { fetchConfig } from '@/lib/api/config';
import { setUnauthorizedHandler } from '@/lib/api/client';
import { loadConfig, replaceConfig, resetConfig } from '@/lib/state/config';
import { setAuthenticated, setUnauthenticated } from '@/lib/state/auth';
import { rememberSignedIn, WAS_AUTHENTICATED_KEY } from '@/lib/state/session';
import { showToast } from '@/lib/state/toast';

async function restoreSession() {
	try {
		const serverConfig = await fetchConfig();
		replaceConfig(serverConfig);
		setAuthenticated(serverConfig.username);
		rememberSignedIn();
	} catch {
		setUnauthenticated();
	}
}

function handleSessionExpired() {
	const wasSignedIn = localStorage.getItem(WAS_AUTHENTICATED_KEY) !== null;
	setUnauthenticated();

	// A visitor who never signed in has no account to expire. This also fires for the
	// startup session check, so don't wipe their locally saved settings.
	if (!wasSignedIn) return;

	localStorage.removeItem(WAS_AUTHENTICATED_KEY);
	resetConfig();
	loadConfig();
	showToast('Session expired — please sign in again', 'error');
}

/** On startup, check whether the browser has a server session. */
export function useSessionBootstrap() {
	useEffect(() => {
		restoreSession();
		setUnauthorizedHandler(handleSessionExpired);
	}, []);
}
