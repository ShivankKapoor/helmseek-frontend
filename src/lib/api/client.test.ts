import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, setUnauthorizedHandler } from './client';

const fetchMock = vi.fn();

function respond(status: number, body?: unknown, contentType = 'application/json') {
	fetchMock.mockResolvedValueOnce(
		new Response(body === undefined ? null : JSON.stringify(body), {
			status,
			headers: body === undefined ? {} : { 'content-type': contentType }
		})
	);
}

beforeEach(() => {
	vi.stubGlobal('fetch', fetchMock);
	setUnauthorizedHandler(() => {});
});

afterEach(() => {
	fetchMock.mockReset();
	vi.unstubAllGlobals();
});

describe('apiFetch', () => {
	it('sends the session cookie and a JSON content type', async () => {
		respond(200, {});
		await apiFetch('/user/config');
		const [, init] = fetchMock.mock.calls[0];
		expect(init.credentials).toBe('include');
		expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
	});

	it('returns the parsed JSON body', async () => {
		respond(200, { quote: 'Hi', author: 'Me' });
		await expect(apiFetch('/quote')).resolves.toEqual({ quote: 'Hi', author: 'Me' });
	});

	it('returns undefined when there is no body', async () => {
		respond(204);
		await expect(apiFetch('/auth/logout', { method: 'POST' })).resolves.toBeUndefined();
	});

	it('returns undefined for non-JSON responses', async () => {
		respond(200, 'ok', 'text/plain');
		await expect(apiFetch('/health')).resolves.toBeUndefined();
	});

	it('throws an ApiError carrying the status for failed requests', async () => {
		respond(500);
		const error = await apiFetch('/user/config').catch((e) => e);
		expect(error).toBeInstanceOf(ApiError);
		expect(error.status).toBe(500);
	});

	it('calls the unauthorized handler and throws on a 401', async () => {
		const handler = vi.fn();
		setUnauthorizedHandler(handler);
		respond(401);

		const error = await apiFetch('/user/config').catch((e) => e);
		expect(handler).toHaveBeenCalledTimes(1);
		expect(error).toMatchObject({ name: 'ApiError', status: 401 });
	});

	it('does not call the unauthorized handler for other errors', async () => {
		const handler = vi.fn();
		setUnauthorizedHandler(handler);
		respond(429);
		await apiFetch('/auth/login').catch(() => {});
		expect(handler).not.toHaveBeenCalled();
	});
});
