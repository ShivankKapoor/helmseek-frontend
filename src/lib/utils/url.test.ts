import { describe, expect, it } from 'vitest';
import { isHttpUrl, normalizeHttpUrl } from './url';

describe('isHttpUrl', () => {
	it.each([
		'https://example.com',
		'http://example.com',
		'https://example.com/path?query=1#hash',
		'http://localhost:3003/',
		'HTTPS://EXAMPLE.COM',
		'  https://example.com  '
	])('accepts %j', (value) => {
		expect(isHttpUrl(value)).toBe(true);
	});

	it.each([
		['javascript:alert(1)'],
		['JaVaScRiPt:alert(1)'],
		['  javascript:alert(1)'],
		['data:text/html,<script>alert(1)</script>'],
		['vbscript:msgbox(1)'],
		['file:///etc/passwd'],
		['mailto:someone@example.com'],
		['ftp://example.com'],
		['//example.com'],
		['example.com'],
		['/relative/path'],
		['not a url'],
		['']
	])('rejects %j', (value) => {
		expect(isHttpUrl(value)).toBe(false);
	});
});

describe('normalizeHttpUrl', () => {
	it.each([
		['https://example.com', 'https://example.com/'],
		['  HTTPS://Example.COM  ', 'https://example.com/'],
		['http://example.com/Path?q=1#top', 'http://example.com/Path?q=1#top'],
		['https://example.com/a b', 'https://example.com/a%20b']
	])('turns %j into %j', (input, expected) => {
		expect(normalizeHttpUrl(input)).toBe(expected);
	});

	it('always starts with a lowercase http:// or https://, which is what the backend requires', () => {
		for (const input of ['HTTP://a.com', 'Https://b.com', ' https://c.com ']) {
			expect(normalizeHttpUrl(input)).toMatch(/^https?:\/\//);
		}
	});

	it.each(['github.com', 'javascript:alert(1)', 'ftp://example.com', 'https://', '//example.com', ''])(
		'returns null for %j',
		(input) => {
			expect(normalizeHttpUrl(input)).toBeNull();
		}
	);
});
