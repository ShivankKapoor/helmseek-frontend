import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { saveConfig } from '@/lib/api/config';
import { setAuthenticated } from '@/lib/state/auth';
import { config } from '@/lib/state/config';
import type { QuickLink } from '@/lib/types/config';
import { resetAppState, setConfig } from '@/test/helpers';
import { QuickLinksSection } from './QuickLinksSection';

vi.mock('@/lib/api/config', () => ({ saveConfig: vi.fn().mockResolvedValue(undefined) }));

const makeLink = (n: number, overrides: Partial<QuickLink> = {}): QuickLink => ({
	id: `ql_${n}`,
	enabled: true,
	text: `Link ${n}`,
	url: `https://example.com/${n}`,
	corner: 'top-left',
	order: n,
	...overrides
});

function setup(quickLinks: QuickLink[] = [], quickLinksEnabled = true) {
	setConfig({ quickLinksEnabled, quickLinks });
	const user = userEvent.setup();
	render(<QuickLinksSection />);
	return user;
}

beforeEach(() => {
	resetAppState();
	vi.mocked(saveConfig).mockClear();
});

describe('QuickLinksSection', () => {
	it('shows an empty state and an add button when enabled', () => {
		setup();
		expect(screen.getByText('No quick links configured')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Add Quick Link/ })).toBeInTheDocument();
	});

	it('hides the list while quick links are disabled and reveals it when enabled', async () => {
		const user = setup([makeLink(1)], false);
		expect(screen.queryByText('Link 1')).not.toBeInTheDocument();

		await user.click(screen.getByLabelText('Enable Quick Links'));
		expect(screen.getByText('Link 1')).toBeInTheDocument();
		expect(config.value.quickLinksEnabled).toBe(true);
	});

	it('adds a link with sensible defaults', async () => {
		const user = setup([makeLink(1)]);
		await user.click(screen.getByRole('button', { name: /Add Quick Link/ }));

		const dialog = screen.getByRole('dialog', { name: 'Add Quick Link' });
		const add = within(dialog).getByRole('button', { name: 'Add' });
		expect(add).toBeDisabled();

		await user.type(within(dialog).getByLabelText('Link Text'), 'Docs');
		await user.type(within(dialog).getByLabelText('URL'), 'https://docs.example.com');
		await user.click(add);

		expect(screen.queryByRole('dialog', { name: 'Add Quick Link' })).not.toBeInTheDocument();
		expect(screen.getByText('Docs')).toBeInTheDocument();
		expect(config.value.quickLinks).toHaveLength(2);
		expect(config.value.quickLinks[1]).toMatchObject({
			text: 'Docs',
			url: 'https://docs.example.com/',
			corner: 'top-right',
			enabled: true,
			order: 1
		});
		expect(config.value.quickLinks[1].id).toMatch(/^ql_/);
	});

	describe('the address field', () => {
		const openAddForm = async () => {
			const user = setup();
			await user.click(screen.getByRole('button', { name: /Add Quick Link/ }));
			const dialog = screen.getByRole('dialog', { name: 'Add Quick Link' });
			await user.type(within(dialog).getByLabelText('Link Text'), 'GitHub');
			return { user, dialog, url: within(dialog).getByLabelText('URL'), add: within(dialog).getByRole('button', { name: 'Add' }) };
		};
		const ERROR = 'Enter a full address starting with http:// or https://';

		it('explains the problem once the user leaves a field with an address that would not save', async () => {
			const { user, dialog, url, add } = await openAddForm();
			await user.type(url, 'github.com');
			expect(within(dialog).queryByText(ERROR)).not.toBeInTheDocument(); // still typing
			await user.tab();

			expect(within(dialog).getByText(ERROR)).toBeInTheDocument();
			expect(url).toHaveAttribute('aria-invalid', 'true');
			expect(add).toBeDisabled();
		});

		it('keeps Add disabled while the address is incomplete, without nagging', async () => {
			const { user, dialog, url, add } = await openAddForm();
			await user.type(url, 'htt');

			expect(add).toBeDisabled();
			expect(within(dialog).queryByText(ERROR)).not.toBeInTheDocument();
		});

		it('clears the message and enables Add as soon as the address is valid', async () => {
			const { user, dialog, url, add } = await openAddForm();
			await user.type(url, 'github.com');
			await user.tab();
			await user.clear(url);
			await user.type(url, 'https://github.com');

			expect(within(dialog).queryByText(ERROR)).not.toBeInTheDocument();
			expect(add).toBeEnabled();
		});

		it.each(['javascript:alert(1)', 'ftp://example.com', 'mailto:me@example.com'])('refuses %s', async (address) => {
			const { user, url, add } = await openAddForm();
			await user.type(url, address);
			await user.tab();
			expect(add).toBeDisabled();
		});

		it('saves the tidied address: trimmed, lowercase scheme and host', async () => {
			const { user, url, add } = await openAddForm();
			await user.type(url, '  HTTPS://GitHub.COM  ');
			await user.click(add);

			expect(config.value.quickLinks[0].url).toBe('https://github.com/');
		});

		it('lets the user repair a link that already has a bad address', async () => {
			const user = setup([makeLink(1, { url: 'example.com' })]);
			await user.click(screen.getByRole('button', { name: 'Edit Link 1' }));
			const dialog = screen.getByRole('dialog', { name: 'Edit Quick Link' });
			const update = within(dialog).getByRole('button', { name: 'Update' });
			const url = within(dialog).getByLabelText('URL');

			expect(update).toBeDisabled();
			await user.click(url);
			await user.tab();
			expect(within(dialog).getByText(ERROR)).toBeInTheDocument();

			await user.clear(url);
			await user.type(url, 'https://example.com');
			await user.click(update);
			expect(config.value.quickLinks[0].url).toBe('https://example.com/');
		});
	});

	it('lets the user pick a corner for the new link', async () => {
		const user = setup();
		await user.click(screen.getByRole('button', { name: /Add Quick Link/ }));
		const dialog = screen.getByRole('dialog');

		await user.type(within(dialog).getByLabelText('Link Text'), 'Docs');
		await user.type(within(dialog).getByLabelText('URL'), 'https://docs.example.com');
		await user.click(within(dialog).getByTitle('Bottom Left'));
		await user.click(within(dialog).getByRole('button', { name: 'Add' }));

		expect(config.value.quickLinks[0].corner).toBe('bottom-left');
	});

	it('edits an existing link, prefilled with its current values', async () => {
		const user = setup([makeLink(1), makeLink(2)]);
		await user.click(screen.getByRole('button', { name: 'Edit Link 2' }));

		const dialog = screen.getByRole('dialog', { name: 'Edit Quick Link' });
		const text = within(dialog).getByLabelText('Link Text');
		expect(text).toHaveValue('Link 2');
		expect(within(dialog).getByLabelText('URL')).toHaveValue('https://example.com/2');

		await user.clear(text);
		await user.type(text, 'Renamed');
		await user.click(within(dialog).getByRole('button', { name: 'Update' }));

		expect(config.value.quickLinks.map((l) => l.text)).toEqual(['Link 1', 'Renamed']);
		expect(config.value.quickLinks[1].id).toBe('ql_2');
	});

	it('deletes a link', async () => {
		const user = setup([makeLink(1), makeLink(2)]);
		await user.click(screen.getByRole('button', { name: 'Delete Link 1' }));

		expect(config.value.quickLinks.map((l) => l.id)).toEqual(['ql_2']);
		expect(screen.queryByText('Link 1')).not.toBeInTheDocument();
	});

	it('stops offering to add links at the maximum of 10', () => {
		setup(Array.from({ length: 10 }, (_, i) => makeLink(i)));
		expect(screen.queryByRole('button', { name: /Add Quick Link/ })).not.toBeInTheDocument();
		expect(screen.getByText('Maximum 10 quick links reached')).toBeInTheDocument();
	});

	it('closes the modal without saving on Cancel and on Escape', async () => {
		const user = setup();
		await user.click(screen.getByRole('button', { name: /Add Quick Link/ }));
		await user.type(screen.getByLabelText('Link Text'), 'Draft');
		await user.click(screen.getByRole('button', { name: 'Cancel' }));
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: /Add Quick Link/ }));
		await user.keyboard('{Escape}');
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(config.value.quickLinks).toEqual([]);
	});

	it('only saves to the server when signed in', async () => {
		const user = setup([makeLink(1)]);
		await user.click(screen.getByRole('button', { name: 'Delete Link 1' }));
		expect(saveConfig).not.toHaveBeenCalled();

		setAuthenticated('test');
		setConfig({ quickLinksEnabled: true, quickLinks: [makeLink(2)] });
		await user.click(await screen.findByRole('button', { name: 'Delete Link 2' }));
		expect(saveConfig).toHaveBeenCalledTimes(1);
		expect(saveConfig).toHaveBeenCalledWith(expect.objectContaining({ quickLinks: [] }));
	});
});
