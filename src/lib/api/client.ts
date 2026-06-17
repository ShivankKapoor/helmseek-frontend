import { PUBLIC_API_URL } from '$env/static/public';

export class ApiError extends Error {
	constructor(public readonly status: number, message: string) {
		super(message);
		this.name = 'ApiError';
	}
}

// Registered by +layout.svelte to handle session expiry globally
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(fn: () => void) {
	unauthorizedHandler = fn;
}

export async function apiFetch<T = void>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${PUBLIC_API_URL}${path}`, {
		credentials: 'include',
		headers: { 'Content-Type': 'application/json', ...init?.headers },
		...init
	});

	if (res.status === 401) {
		unauthorizedHandler?.();
		throw new ApiError(401, res.statusText);
	}

	if (!res.ok) throw new ApiError(res.status, res.statusText);

	const contentType = res.headers.get('content-type') ?? '';
	const hasBody = res.status !== 204 && contentType.includes('application/json');
	return hasBody ? res.json() : (undefined as T);
}
