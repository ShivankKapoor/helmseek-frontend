import { describe, expect, it } from 'vitest';
import { cx } from './cx';

describe('cx', () => {
	it('joins class names with spaces', () => {
		expect(cx('a', 'b', 'c')).toBe('a b c');
	});

	it('skips falsy values', () => {
		expect(cx('a', false, null, undefined, '', 'b')).toBe('a b');
		expect(cx(false && 'hidden', 1 > 0 && 'shown')).toBe('shown');
	});

	it('returns an empty string when nothing is left', () => {
		expect(cx(false, null)).toBe('');
	});
});
