import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { SearchBar } from './SearchBar';

function setup() {
	const user = userEvent.setup();
	const writeText = vi.spyOn(navigator.clipboard, 'writeText');
	render(<SearchBar />);
	return { user, writeText, input: screen.getByRole('textbox', { name: 'Search Google' }) };
}

beforeEach(() => {
	vi.stubGlobal('location', { href: 'http://localhost/' });
});

describe('SearchBar', () => {
	it('focuses the search box shortly after loading', async () => {
		const { input } = setup();
		await waitFor(() => expect(input).toHaveFocus());
	});

	it('searches Google with the encoded query', async () => {
		const { user, input } = setup();
		await user.type(input, 'cats & dogs{Enter}');
		expect(window.location.href).toBe('https://www.google.com/search?q=cats%20%26%20dogs');
	});

	describe('calculator mode', () => {
		it('shows the answer for a leading "=" expression', async () => {
			const { user, input } = setup();
			await user.type(input, '=2+3*4');
			expect(screen.getByText('= 14')).toBeInTheDocument();
			expect(screen.getByText('Press Enter to copy')).toBeInTheDocument();
		});

		it('hides the answer for invalid expressions and when "=" is removed', async () => {
			const { user, input } = setup();
			await user.type(input, '=2**3');
			expect(screen.queryByText(/^= /)).not.toBeInTheDocument();

			await user.clear(input);
			await user.type(input, '=1+1');
			expect(screen.getByText('= 2')).toBeInTheDocument();

			await user.clear(input);
			await user.type(input, '1+1');
			expect(screen.queryByText(/^= /)).not.toBeInTheDocument();
		});

		it('copies the answer instead of searching when Enter is pressed', async () => {
			const { user, input, writeText } = setup();
			await user.type(input, '=6*7{Enter}');

			expect(writeText).toHaveBeenCalledWith('42');
			expect(await screen.findByText('Copied to clipboard!')).toBeInTheDocument();
			expect(window.location.href).toBe('http://localhost/');
		});

		it('reports when copying fails', async () => {
			const { user, input, writeText } = setup();
			writeText.mockRejectedValueOnce(new Error('denied'));
			await user.type(input, '=1+1{Enter}');

			expect(await screen.findByText('Failed to copy to clipboard')).toBeInTheDocument();
		});
	});

	describe('empty search', () => {
		it('nudges the user instead of searching', async () => {
			const { user } = setup();
			await user.click(screen.getByRole('button', { name: 'Search' }));

			const popup = (await screen.findAllByRole('status'))[0];
			expect(popup).toHaveClass('show');
			expect(popup.textContent).not.toBe('');
			expect(window.location.href).toBe('http://localhost/');
		});

		it('treats whitespace as empty', async () => {
			const { user, input } = setup();
			await user.type(input, '   {Enter}');
			expect(window.location.href).toBe('http://localhost/');
		});
	});
});
