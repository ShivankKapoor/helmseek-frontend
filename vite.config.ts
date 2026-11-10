import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
	plugins: [preact()],
	resolve: {
		alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
	},
	// Keep the PUBLIC_ prefix so existing .env files and the Dockerfile keep working.
	envPrefix: ['VITE_', 'PUBLIC_'],
	css: {
		// .close-btn -> styles.closeBtn (the original kebab-case key stays available too)
		modules: { localsConvention: 'camelCase' }
	},
	server: { port: 3003 },
	// Same output directory the Dockerfile already copies into nginx.
	build: { outDir: 'build' },
	test: {
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts'],
		include: ['src/**/*.test.{ts,tsx}'],
		// Pin the API URL so tests don't depend on a developer's local .env.
		env: { PUBLIC_API_URL: 'http://api.test' }
	}
});
