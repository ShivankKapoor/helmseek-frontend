import { apiFetch } from './client';

export function login(username: string, password: string) {
	return apiFetch('/auth/login', {
		method: 'POST',
		body: JSON.stringify({ username, password })
	});
}

export function logout() {
	return apiFetch('/auth/logout', { method: 'POST' });
}
