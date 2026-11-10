import { describe, expect, it } from 'vitest';
import { isHttpUrl } from './url';

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
