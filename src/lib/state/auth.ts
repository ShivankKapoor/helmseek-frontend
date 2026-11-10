import { signal } from '@preact/signals';

export const authenticated = signal(false);
/** True on startup until the first session check completes. */
export const checking = signal(true);
export const username = signal('');

export function setAuthenticated(name = '') {
	authenticated.value = true;
	checking.value = false;
	username.value = name;
}

export function setUnauthenticated() {
	authenticated.value = false;
	checking.value = false;
	username.value = '';
}
