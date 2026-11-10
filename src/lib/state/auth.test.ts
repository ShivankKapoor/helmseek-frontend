import { describe, expect, it } from 'vitest';
import { authenticated, checking, setAuthenticated, setUnauthenticated, username } from './auth';

describe('auth state', () => {
	it('records the username and stops checking when authenticated', () => {
		setAuthenticated('test');
		expect(authenticated.value).toBe(true);
		expect(checking.value).toBe(false);
		expect(username.value).toBe('test');
	});

	it('allows being authenticated without a known username', () => {
		setAuthenticated();
		expect(authenticated.value).toBe(true);
		expect(username.value).toBe('');
	});

	it('clears everything when unauthenticated', () => {
		setAuthenticated('test');
		setUnauthenticated();
		expect(authenticated.value).toBe(false);
		expect(checking.value).toBe(false);
		expect(username.value).toBe('');
	});
});
