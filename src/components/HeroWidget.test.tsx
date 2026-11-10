import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/preact';
import { resetAppState, setConfig } from '@/test/helpers';
import { HeroWidget } from './HeroWidget';

/** Monday 9 Nov 2026, 09:30:15 local time. */
const MORNING = new Date(2026, 10, 9, 9, 30, 15);
const DATE_TEXT = 'Monday, November 9, 2026';

beforeEach(() => {
	resetAppState();
	vi.useFakeTimers();
	vi.setSystemTime(MORNING);
});

describe('HeroWidget', () => {
	it('shows a greeting and the date in greeting mode', () => {
		setConfig({ heroMode: 'greeting' });
		render(<HeroWidget />);
		expect(screen.getByText('Good Morning')).toBeInTheDocument();
		expect(screen.getByText(DATE_TEXT)).toBeInTheDocument();
		expect(screen.queryByText(/AM|PM/)).not.toBeInTheDocument();
	});

	it('includes the custom name only when one is set', () => {
		setConfig({ heroMode: 'greeting', heroGreetingName: '  Alex  ' });
		render(<HeroWidget />);
		expect(screen.getByText('Alex')).toBeInTheDocument();
	});

	it('shows only the clock and date in clock mode', () => {
		setConfig({ heroMode: 'clock', heroClockFormat: '12h' });
		render(<HeroWidget />);
		expect(screen.getByText('9:30 AM')).toBeInTheDocument();
		expect(screen.getByText(DATE_TEXT)).toBeInTheDocument();
		expect(screen.queryByText('Good Morning')).not.toBeInTheDocument();
	});

	it('shows greeting, clock and date in both mode', () => {
		setConfig({ heroMode: 'both', heroClockFormat: '24h' });
		render(<HeroWidget />);
		expect(screen.getByText('Good Morning')).toBeInTheDocument();
		expect(screen.getByText('09:30')).toBeInTheDocument();
		expect(screen.getByText(DATE_TEXT)).toBeInTheDocument();
	});

	it('shows seconds when enabled', () => {
		setConfig({ heroMode: 'clock', heroShowSeconds: true });
		render(<HeroWidget />);
		expect(screen.getByText('9:30:15 AM')).toBeInTheDocument();
	});

	it('renders nothing when disabled or set to none', () => {
		setConfig({ heroEnabled: false, heroMode: 'both' });
		const disabled = render(<HeroWidget />);
		expect(disabled.container).toBeEmptyDOMElement();
		disabled.unmount();

		setConfig({ heroEnabled: true, heroMode: 'none' });
		const none = render(<HeroWidget />);
		expect(none.container).toBeEmptyDOMElement();
	});

	it('updates the clock every 30 seconds, or every second with seconds shown', async () => {
		setConfig({ heroMode: 'clock' });
		render(<HeroWidget />);
		expect(screen.getByText('9:30 AM')).toBeInTheDocument();

		// 09:30:15 + 30s is 09:30:45: the clock ticked, but the displayed minute hasn't changed yet.
		await act(() => { vi.advanceTimersByTime(30_000); });
		expect(screen.getByText('9:30 AM')).toBeInTheDocument();

		await act(() => { vi.advanceTimersByTime(30_000); });
		expect(screen.getByText('9:31 AM')).toBeInTheDocument();

		await act(() => setConfig({ heroMode: 'clock', heroShowSeconds: true }));
		await act(() => { vi.advanceTimersByTime(1000); });
		expect(screen.getByText('9:31:16 AM')).toBeInTheDocument();
	});
});
