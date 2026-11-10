import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/preact';
import { afterEach, vi } from 'vitest';

afterEach(() => {
	cleanup();
	localStorage.clear();
	vi.restoreAllMocks();
	vi.useRealTimers();
});
