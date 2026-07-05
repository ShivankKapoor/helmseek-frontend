import { apiFetch } from './client';

export interface QuoteResponse {
	quote: string;
	author: string;
}

export async function fetchQuote(): Promise<QuoteResponse> {
	return apiFetch<QuoteResponse>('/quote');
}

export async function hideQuote(): Promise<void> {
	return apiFetch('/quote/hideQuote', { method: 'POST' });
}

export async function unhideQuote(): Promise<void> {
	return apiFetch('/quote/unhideQuote', { method: 'POST' });
}
