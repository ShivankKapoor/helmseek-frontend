import { describe, expect, it } from 'vitest';
import { hexToRgb } from './colors';

describe('hexToRgb', () => {
	it('converts hex colors to an "r, g, b" string', () => {
		expect(hexToRgb('#1a73e8')).toBe('26, 115, 232');
		expect(hexToRgb('#FF6720')).toBe('255, 103, 32');
	});

	it('accepts a missing # and surrounding whitespace', () => {
		expect(hexToRgb('1a73e8')).toBe('26, 115, 232');
		expect(hexToRgb('  #34a853 ')).toBe('52, 168, 83');
	});

	it('falls back to the default blue for invalid input', () => {
		expect(hexToRgb('')).toBe('26, 115, 232');
		expect(hexToRgb('blue')).toBe('26, 115, 232');
		expect(hexToRgb('#fff')).toBe('26, 115, 232');
	});
});
