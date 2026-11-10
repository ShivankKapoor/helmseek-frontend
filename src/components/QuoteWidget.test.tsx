import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/preact';
import { fetchQuote } from '@/lib/api/quote';
import { setAuthenticated } from '@/lib/state/auth';
import { resetAppState, setConfig } from '@/test/helpers';
import { QuoteWidget } from './QuoteWidget';

vi.mock('@/lib/api/quote', () => ({ fetchQuote: vi.fn() }));

beforeEach(() => {
	resetAppState();
	vi.mocked(fetchQuote).mockReset();
	vi.mocked(fetchQuote).mockResolvedValue({ quote: 'Be kind', author: 'Someone' });
});

describe('QuoteWidget', () => {
	it('shows the quote and its author when enabled and signed in', async () => {
		setAuthenticated('test');
		setConfig({ motdEnabled: true });
		const { container } = render(<QuoteWidget />);

		await waitFor(() => expect(container).toHaveTextContent('“Be kind”'));
		expect(container).toHaveTextContent('— Someone');
	});

	it.each([
		['signed out', () => setConfig({ motdEnabled: true })],
		['disabled', () => { setAuthenticated('test'); setConfig({ motdEnabled: false }); }],
		['hidden for today', () => { setAuthenticated('test'); setConfig({ motdEnabled: true, hideQuote: true }); }]
	])('does not fetch or show anything when %s', async (_label, arrange) => {
		arrange();
		const { container } = render(<QuoteWidget />);
		await Promise.resolve();

		expect(fetchQuote).not.toHaveBeenCalled();
		expect(container).toBeEmptyDOMElement();
	});

	it('renders nothing when the quote service has no quote', async () => {
		vi.mocked(fetchQuote).mockResolvedValue({ quote: 'UNKNOWN', author: 'UNKNOWN' });
		setAuthenticated('test');
		setConfig({ motdEnabled: true });
		const { container } = render(<QuoteWidget />);

		await waitFor(() => expect(fetchQuote).toHaveBeenCalled());
		expect(container).toBeEmptyDOMElement();
	});

	it('renders nothing when the request fails', async () => {
		vi.mocked(fetchQuote).mockRejectedValue(new Error('offline'));
		setAuthenticated('test');
		setConfig({ motdEnabled: true });
		const { container } = render(<QuoteWidget />);

		await waitFor(() => expect(fetchQuote).toHaveBeenCalled());
		expect(container).toBeEmptyDOMElement();
	});

	it('can be marked for the custom context menu', async () => {
		setAuthenticated('test');
		setConfig({ motdEnabled: true });
		const { container } = render(<QuoteWidget />);

		await waitFor(() => expect(container.querySelector('[data-context-menu="quote"]')).not.toBeNull());
	});
});
