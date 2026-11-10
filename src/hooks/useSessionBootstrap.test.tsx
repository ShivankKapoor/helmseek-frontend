import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/preact';
import { DEFAULT_CONFIG } from '@/lib/types/config';
import { apiFetch } from '@/lib/api/client';
import { authenticated, checking, username } from '@/lib/state/auth';
import { config, loadConfig } from '@/lib/state/config';
import { toasts } from '@/lib/state/toast';
import { jsonResponse, resetAppState } from '@/test/helpers';
import { useSessionBootstrap } from './useSessionBootstrap';

const fetchMock = vi.fn();

function Harness() {
	useSessionBootstrap();
	return null;
}

const serverConfig = { ...DEFAULT_CONFIG, username: 'test', themeMode: 'dark', quickLinks: '[]' };

beforeEach(() => {
	resetAppState();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	fetchMock.mockReset();
	vi.unstubAllGlobals();
});

describe('useSessionBootstrap', () => {
	it("signs in with the server's config when there is a valid session", async () => {
		fetchMock.mockResolvedValue(jsonResponse(serverConfig));
		render(<Harness />);

		await waitFor(() => expect(authenticated.value).toBe(true));
		expect(username.value).toBe('test');
		expect(checking.value).toBe(false);
		expect(config.value.themeMode).toBe('dark');
	});

	it('stays signed out, quietly, when there is no session', async () => {
		fetchMock.mockResolvedValue(jsonResponse({}, 401));
		render(<Harness />);

		await waitFor(() => expect(checking.value).toBe(false));
		expect(authenticated.value).toBe(false);
		expect(toasts.value).toHaveLength(0);
	});

	it("keeps a signed-out visitor's saved settings", async () => {
		localStorage.setItem('helm_config', JSON.stringify({ themeMode: 'dark', fontFamily: 'Sora' }));
		loadConfig(); // main.tsx does this before the app renders
		fetchMock.mockResolvedValue(jsonResponse({}, 401));
		render(<Harness />);

		await waitFor(() => expect(checking.value).toBe(false));
		expect(config.value).toMatchObject({ themeMode: 'dark', fontFamily: 'Sora' });
		expect(JSON.parse(localStorage.getItem('helm_config')!)).toMatchObject({ themeMode: 'dark' });
	});

	it('remembers that this browser has had a session', async () => {
		fetchMock.mockResolvedValue(jsonResponse(serverConfig));
		render(<Harness />);

		await waitFor(() => expect(authenticated.value).toBe(true));
		expect(localStorage.getItem('helm_was_authenticated')).toBe('1');
	});

	it('tells a previously signed-in user when their session expires', async () => {
		localStorage.setItem('helm_was_authenticated', '1');
		localStorage.setItem('helm_config', JSON.stringify({ themeMode: 'dark' }));
		fetchMock.mockResolvedValue(jsonResponse({}, 401));
		render(<Harness />);

		await waitFor(() => expect(toasts.value).toHaveLength(1));
		expect(toasts.value[0]).toMatchObject({ message: 'Session expired — please sign in again', type: 'error' });
		expect(localStorage.getItem('helm_was_authenticated')).toBeNull();
	});

	it('handles a 401 from any later request the same way', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse(serverConfig));
		render(<Harness />);
		await waitFor(() => expect(authenticated.value).toBe(true));

		localStorage.setItem('helm_was_authenticated', '1');
		fetchMock.mockResolvedValueOnce(jsonResponse({}, 401));
		await apiFetch('/quote').catch(() => {});

		expect(authenticated.value).toBe(false);
		expect(toasts.value[0]?.message).toBe('Session expired — please sign in again');
	});
});
