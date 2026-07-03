import { apiFetch } from './client';

export interface QuoteResponse {
	quote: string;
	author: string;
}

export async function fetchQuote(): Promise<QuoteResponse> {
	return apiFetch<QuoteResponse>('/user/quote');
}
