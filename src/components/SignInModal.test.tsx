import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { login } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { fetchConfig } from '@/lib/api/config';
import { DEFAULT_CONFIG } from '@/lib/types/config';
import { authenticated, username } from '@/lib/state/auth';
import { config } from '@/lib/state/config';
import { resetAppState } from '@/test/helpers';
import { SignInModal } from './SignInModal';

vi.mock('@/lib/api/auth', () => ({ login: vi.fn(), logout: vi.fn() }));
vi.mock('@/lib/api/config', () => ({ fetchConfig: vi.fn(), saveConfig: vi.fn() }));

const onClose = vi.fn();

function setup(open = true) {
	const user = userEvent.setup();
	render(<SignInModal open={open} onClose={onClose} />);
	return user;
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>, name = 'test', password = 'secret') {
	await user.type(screen.getByLabelText('Username'), name);
	await user.type(screen.getByLabelText('Password'), password);
	await user.click(screen.getByRole('button', { name: 'Sign In' }));
}

beforeEach(() => {
	resetAppState();
	onClose.mockReset();
	vi.mocked(login).mockResolvedValue(undefined);
	vi.mocked(fetchConfig).mockResolvedValue({ ...DEFAULT_CONFIG, username: 'test', themeMode: 'dark' });
});

describe('SignInModal', () => {
	it('renders nothing while closed', () => {
		setup(false);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('disables Sign In until both fields are filled', async () => {
		const user = setup();
		const submit = screen.getByRole('button', { name: 'Sign In' });
		expect(submit).toBeDisabled();

		await user.type(screen.getByLabelText('Username'), 'test');
		expect(submit).toBeDisabled();

		await user.type(screen.getByLabelText('Password'), 'secret');
		expect(submit).toBeEnabled();
	});

	it('toggles password visibility', async () => {
		const user = setup();
		const password = screen.getByLabelText('Password');
		expect(password).toHaveAttribute('type', 'password');

		await user.click(screen.getByRole('button', { name: 'Toggle password visibility' }));
		expect(password).toHaveAttribute('type', 'text');
	});

	it('signs in, loads the saved config and closes', async () => {
		const user = setup();
		await fillAndSubmit(user);

		await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
		expect(login).toHaveBeenCalledWith('test', 'secret');
		expect(authenticated.value).toBe(true);
		expect(username.value).toBe('test');
		expect(config.value.themeMode).toBe('dark');
		expect(localStorage.getItem('helm_was_authenticated')).toBe('1');
	});

	it('still signs in when the saved config cannot be loaded', async () => {
		vi.mocked(fetchConfig).mockRejectedValue(new ApiError(500, 'Server Error'));
		const user = setup();
		await fillAndSubmit(user);

		await waitFor(() => expect(onClose).toHaveBeenCalled());
		expect(authenticated.value).toBe(true);
		expect(username.value).toBe('');
	});

	it('shows an invalid-credentials message on a 401', async () => {
		vi.mocked(login).mockRejectedValue(new ApiError(401, 'Unauthorized'));
		const user = setup();
		await fillAndSubmit(user);

		expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password.');
		expect(authenticated.value).toBe(false);
		expect(onClose).not.toHaveBeenCalled();
	});

	it('shows a generic message for other failures such as rate limiting', async () => {
		vi.mocked(login).mockRejectedValue(new ApiError(429, 'Too Many Requests'));
		const user = setup();
		await fillAndSubmit(user);

		expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Please try again.');
	});

	it('closes and clears the form on Escape', async () => {
		const user = setup();
		await user.type(screen.getByLabelText('Username'), 'test');
		await user.keyboard('{Escape}');

		expect(onClose).toHaveBeenCalledTimes(1);
		expect(screen.getByLabelText('Username')).toHaveValue('');
	});

	it('closes when the backdrop is clicked, but not when the dialog is', async () => {
		const user = setup();
		await user.click(screen.getByRole('dialog'));
		expect(onClose).not.toHaveBeenCalled();

		await user.click(screen.getByRole('dialog').parentElement!);
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
