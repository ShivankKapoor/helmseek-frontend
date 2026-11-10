import { describe, expect, it } from 'vitest';
import { formatClock, formatDate, getGreeting } from './time';

/** A local-time date, so the tests don't depend on the machine's timezone. */
const at = (hours: number, minutes = 0, seconds = 0) => new Date(2026, 10, 9, hours, minutes, seconds);

describe('getGreeting', () => {
	it.each([
		[0, 'Good Night'],
		[4, 'Good Night'],
		[5, 'Good Morning'],
		[11, 'Good Morning'],
		[12, 'Good Afternoon'],
		[16, 'Good Afternoon'],
		[17, 'Good Evening'],
		[21, 'Good Evening'],
		[22, 'Good Night'],
		[23, 'Good Night']
	])('at %s:00 says %s', (hour, expected) => {
		expect(getGreeting(at(hour))).toBe(expected);
	});
});

describe('formatClock', () => {
	it('formats 12-hour time with AM/PM', () => {
		expect(formatClock(at(0, 5), '12h', false)).toBe('12:05 AM');
		expect(formatClock(at(9, 30), '12h', false)).toBe('9:30 AM');
		expect(formatClock(at(12, 0), '12h', false)).toBe('12:00 PM');
		expect(formatClock(at(15, 45), '12h', false)).toBe('3:45 PM');
	});

	it('formats 24-hour time with zero padding', () => {
		expect(formatClock(at(0, 5), '24h', false)).toBe('00:05');
		expect(formatClock(at(15, 45), '24h', false)).toBe('15:45');
	});

	it('appends seconds when asked', () => {
		expect(formatClock(at(15, 45, 7), '12h', true)).toBe('3:45:07 PM');
		expect(formatClock(at(15, 45, 7), '24h', true)).toBe('15:45:07');
	});
});

describe('formatDate', () => {
	it('writes the full weekday and date', () => {
		expect(formatDate(at(8))).toBe('Monday, November 9, 2026');
	});
});
