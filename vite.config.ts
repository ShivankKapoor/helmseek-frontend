import { defineConfig } from 'vite';
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
	build: { outDir: 'build' }
});
