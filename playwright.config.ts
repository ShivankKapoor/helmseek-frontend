import { defineConfig } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: `http://localhost:${PORT}`,
		// Use the installed Google Chrome instead of downloading a bundled browser.
		channel: 'chrome',
		trace: 'retain-on-failure'
	},
	webServer: {
		command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
		url: `http://localhost:${PORT}`,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		// An empty API URL makes the app call its own origin, where the tests' fake backend answers.
		env: { PUBLIC_API_URL: '' }
	}
});
