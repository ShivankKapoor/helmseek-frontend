/**
 * The address as a clean `http://` or `https://` URL, or null if it isn't one.
 *
 * Whitespace is trimmed and the scheme is lowercased. That matters because the backend only accepts
 * quick links that start with a lowercase `http://` or `https://`, and refuses the whole save otherwise.
 */
export function normalizeHttpUrl(value: string): string | null {
	try {
		const url = new URL(value.trim());
		return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
	} catch {
		return null; // not an absolute URL at all
	}
}

/** True for an absolute http(s) address, so `javascript:`, `data:` and the like are never launched. */
export function isHttpUrl(value: string): boolean {
	return normalizeHttpUrl(value) !== null;
}
