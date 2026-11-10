/**
 * True for an absolute http(s) address. Used before offering to open a link the user typed in,
 * so that addresses like `javascript:` or `data:` are never launched.
 */
export function isHttpUrl(value: string): boolean {
	try {
		const { protocol } = new URL(value);
		return protocol === 'http:' || protocol === 'https:';
	} catch {
		return false; // not an absolute URL at all
	}
}
