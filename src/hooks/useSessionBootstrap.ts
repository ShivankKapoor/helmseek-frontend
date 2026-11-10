import { useEffect } from 'preact/hooks';
import { fetchConfig } from '@/lib/api/config';
import { setUnauthorizedHandler } from '@/lib/api/client';
import { loadConfig, replaceConfig, resetConfig } from '@/lib/state/config';
import { setAuthenticated, setUnauthenticated } from '@/lib/state/auth';
import { WAS_AUTHENTICATED_KEY } from '@/lib/state/session';
import { showToast } from '@/lib/state/toast';

async function restoreSession() {
	try {
		const serverConfig = await fetchConfig();
		replaceConfig(serverConfig);
		setAuthenticated(serverConfig.username);
	} catch {
		setUnauthenticated();
	}
}

function handleSessionExpired() {
	const wasSignedIn = localStorage.getItem(WAS_AUTHENTICATED_KEY) !== null;
	localStorage.removeItem(WAS_AUTHENTICATED_KEY);
	setUnauthenticated();
	resetConfig();
	loadConfig();
	if (wasSignedIn) showToast('Session expired — please sign in again', 'error');
}

/** On startup: show the cached config immediately, then check for a server session. */
export function useSessionBootstrap() {
	useEffect(() => {
		loadConfig();
		restoreSession();
		setUnauthorizedHandler(handleSessionExpired);
	}, []);
}
