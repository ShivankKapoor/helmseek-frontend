import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { setAuthenticated } from '@/lib/state/auth';
import { config } from '@/lib/state/config';
import { resetAppState } from '@/test/helpers';
import { Settings } from './Settings';

vi.mock('@/lib/api/config', () => ({
	saveConfig: vi.fn().mockResolvedValue(undefined),
	saveWeatherCache: vi.fn(),
	fetchConfig: vi.fn()
}));
vi.mock('@/lib/api/auth', () => ({ login: vi.fn(), logout: vi.fn().mockResolvedValue(undefined) }));

const SIGNED_IN_ONLY = ['Quote of the Day', 'Configuration Sync', 'Account'];

async function openSettings() {
	const user = userEvent.setup();
	render(<Settings />);
	await user.click(screen.getByRole('button', { name: 'Settings' }));
	return user;
}

beforeEach(resetAppState);

describe('Settings', () => {
	it('is closed until the gear button is clicked', async () => {
		render(<Settings />);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
		expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
	});

	it('shows the always-available sections', async () => {
		await openSettings();
		for (const title of ['Theme', 'Color Scheme', 'Font', 'Hero Widget', 'Weather Widget', 'Quick Links']) {
			expect(screen.getByText(title)).toBeInTheDocument();
		}
	});

	it('hides the account sections when signed out', async () => {
		await openSettings();
		for (const title of SIGNED_IN_ONLY) expect(screen.queryByText(title)).not.toBeInTheDocument();
	});

	it('shows the account sections when signed in', async () => {
		setAuthenticated('test');
		await openSettings();
		for (const title of SIGNED_IN_ONLY) expect(screen.getByText(title)).toBeInTheDocument();
	});

	it('toggles between light and dark mode', async () => {
		const user = await openSettings();
		await user.click(screen.getByRole('button', { name: /Light Mode/ }));
		expect(config.value.themeMode).toBe('dark');
		expect(screen.getByRole('button', { name: /Dark Mode/ })).toBeInTheDocument();
	});

	it('changes the color scheme', async () => {
		const user = await openSettings();
		await user.selectOptions(screen.getByRole('combobox', { name: 'Color scheme' }), 'Green');
		expect(config.value.selectedColor).toBe('#34a853,#2e7d32');
	});

	it('reveals clock options only for clock modes', async () => {
		const user = await openSettings();
		expect(screen.queryByLabelText('Clock Format')).not.toBeInTheDocument();

		await user.selectOptions(screen.getByLabelText('Display Mode'), 'both');
		expect(screen.getByLabelText('Clock Format')).toBeInTheDocument();
		expect(screen.getByLabelText('Custom Name (optional)')).toBeInTheDocument();

		await user.selectOptions(screen.getByLabelText('Display Mode'), 'clock');
		expect(screen.queryByLabelText('Custom Name (optional)')).not.toBeInTheDocument();
	});

	it('closes with the close button, Escape, and a backdrop click', async () => {
		const user = await openSettings();
		await user.click(screen.getByRole('button', { name: 'Close settings' }));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Settings' }));
		await user.keyboard('{Escape}');
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Settings' }));
		await user.click(screen.getByRole('dialog').parentElement!);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('signs out from the account section and closes', async () => {
		setAuthenticated('test');
		const user = await openSettings();
		await user.click(screen.getByRole('button', { name: /Sign Out/ }));

		await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(localStorage.getItem('helm_was_authenticated')).toBeNull();
	});
});
