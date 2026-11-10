import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '@/lib/types/config';
import * as configApi from '@/lib/api/config';
import { authenticated, setAuthenticated, setUnauthenticated } from './auth';
import { config, loadConfig, replaceConfig, resetConfig, serverSynced, updateAndSave, updateConfig } from './config';

vi.mock('@/lib/api/config', () => ({ saveConfig: vi.fn().mockResolvedValue(undefined) }));

const STORAGE_KEY = 'helm_config';
const storedConfig = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');

beforeEach(() => {
	resetConfig();
	setUnauthenticated();
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

	it('swallows save failures so the UI does not throw', async () => {
		vi.mocked(configApi.saveConfig).mockRejectedValueOnce(new Error('offline'));
		setAuthenticated('test');
		expect(() => updateAndSave({ themeMode: 'dark' })).not.toThrow();
		await Promise.resolve();
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
