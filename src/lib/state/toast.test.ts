import { beforeEach, describe, expect, it, vi } from 'vitest';
import { showToast, toasts } from './toast';

beforeEach(() => {
	vi.useFakeTimers();
	toasts.value = [];
});

describe('showToast', () => {
	it('adds a toast with the given message and type', () => {
		showToast('Saved', 'success');
		expect(toasts.value).toEqual([expect.objectContaining({ message: 'Saved', type: 'success' })]);
	});

	it('defaults to the info type', () => {
		showToast('Heads up');
		expect(toasts.value[0].type).toBe('info');
	});

	it('removes the toast after its duration', () => {
		showToast('Bye', 'info', 1000);
		vi.advanceTimersByTime(999);
		expect(toasts.value).toHaveLength(1);
		vi.advanceTimersByTime(1);
		expect(toasts.value).toHaveLength(0);
	});

	it('gives each toast its own id and expires them independently', () => {
		showToast('first', 'info', 1000);
		showToast('second', 'info', 3000);
		const [first, second] = toasts.value;
		expect(first.id).not.toBe(second.id);

		vi.advanceTimersByTime(1000);
		expect(toasts.value.map((t) => t.message)).toEqual(['second']);
	});
});
