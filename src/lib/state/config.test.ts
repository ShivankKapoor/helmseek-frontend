import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '@/lib/types/config';
import * as configApi from '@/lib/api/config';
import { ApiError } from '@/lib/api/client';
import { authenticated, setAuthenticated, setUnauthenticated } from './auth';
import { config, loadConfig, replaceConfig, resetConfig, serverSynced, updateAndSave, updateConfig } from './config';
import { toasts } from './toast';

vi.mock('@/lib/api/config', () => ({ saveConfig: vi.fn().mockResolvedValue(undefined) }));

const STORAGE_KEY = 'helm_config';
const storedConfig = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');

beforeEach(() => {
	resetConfig();
	setUnauthenticated();
	toasts.value = [];
});

describe('loadConfig', () => {
	it('keeps the defaults when nothing is stored', () => {
		loadConfig();
		expect(config.value).toEqual(DEFAULT_CONFIG);
	});

	it('merges the stored config over the defaults', () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ themeMode: 'dark', heroMode: 'clock' }));
		loadConfig();
		expect(config.value).toEqual({ ...DEFAULT_CONFIG, themeMode: 'dark', heroMode: 'clock' });
	});

	it('ignores null and undefined values so defaults are not overwritten', () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ fontFamily: null, selectedColor: '#34a853,#2e7d32' }));
		loadConfig();
		expect(config.value.fontFamily).toBe(DEFAULT_CONFIG.fontFamily);
		expect(config.value.selectedColor).toBe('#34a853,#2e7d32');
	});

	it('keeps the defaults when the stored JSON is corrupt', () => {
		localStorage.setItem(STORAGE_KEY, '{not json');
		loadConfig();
		expect(config.value).toEqual(DEFAULT_CONFIG);
	});
});

describe('updateConfig', () => {
	it('merges the change and persists it', () => {
		updateConfig({ themeMode: 'dark' });
		expect(config.value.themeMode).toBe('dark');
		expect(config.value.heroMode).toBe(DEFAULT_CONFIG.heroMode);
		expect(storedConfig().themeMode).toBe('dark');
	});

	it('does not talk to the server', () => {
		updateConfig({ themeMode: 'dark' });
		expect(configApi.saveConfig).not.toHaveBeenCalled();
	});
});

describe('updateAndSave', () => {
	it('only updates locally when signed out', () => {
		updateAndSave({ themeMode: 'dark' });
		expect(config.value.themeMode).toBe('dark');
		expect(configApi.saveConfig).not.toHaveBeenCalled();
	});

	it('also saves the full updated config when signed in', () => {
		setAuthenticated('test');
		updateAndSave({ themeMode: 'dark' });
		expect(authenticated.value).toBe(true);
		expect(configApi.saveConfig).toHaveBeenCalledWith(expect.objectContaining({ themeMode: 'dark' }));
	});

	describe('when the server save fails', () => {
		const SAVE_FAILED = "Couldn't save your changes to the server";
		const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

		beforeEach(() => setAuthenticated('test'));

		it('keeps the local change and tells the user', async () => {
			vi.mocked(configApi.saveConfig).mockRejectedValueOnce(new ApiError(400, 'Bad Request'));
			updateAndSave({ themeMode: 'dark' });
			await flush();

			expect(config.value.themeMode).toBe('dark');
			expect(toasts.value.map((t) => [t.message, t.type])).toEqual([[SAVE_FAILED, 'error']]);
		});

		it('also tells the user when the network is down', async () => {
			vi.mocked(configApi.saveConfig).mockRejectedValueOnce(new TypeError('Failed to fetch'));
			updateAndSave({ themeMode: 'dark' });
			await flush();

			expect(toasts.value.map((t) => t.message)).toEqual([SAVE_FAILED]);
		});

		it('shows the message once however many saves fail in a row', async () => {
			vi.mocked(configApi.saveConfig).mockRejectedValue(new ApiError(500, 'Server Error'));
			updateAndSave({ themeMode: 'dark' });
			updateAndSave({ themeMode: 'light' });
			updateAndSave({ themeMode: 'dark' });
			await flush();

			expect(toasts.value).toHaveLength(1);
			vi.mocked(configApi.saveConfig).mockResolvedValue(undefined);
		});

		it('stays quiet on a 401, which is already reported as an expired session', async () => {
			vi.mocked(configApi.saveConfig).mockRejectedValueOnce(new ApiError(401, 'Unauthorized'));
			updateAndSave({ themeMode: 'dark' });
			await flush();

			expect(toasts.value).toEqual([]);
		});

		it('stays quiet when the save works', async () => {
			updateAndSave({ themeMode: 'dark' });
			await flush();

			expect(toasts.value).toEqual([]);
		});
	});
});

describe('replaceConfig', () => {
	it("replaces the config with the server's copy and marks it synced", () => {
		replaceConfig({ ...DEFAULT_CONFIG, username: 'test', heroGreetingName: 'Alex' });
		expect(config.value.username).toBe('test');
		expect(serverSynced.value).toBe(true);
		expect(storedConfig().heroGreetingName).toBe('Alex');
	});
});

describe('resetConfig', () => {
	it('restores the defaults, clears storage and the synced flag', () => {
		replaceConfig({ ...DEFAULT_CONFIG, username: 'test' });
		resetConfig();
		expect(config.value).toEqual(DEFAULT_CONFIG);
		expect(serverSynced.value).toBe(false);
		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
	});
});
