// @ts-check
import { defineConfig } from 'astro/config';
import { sessionDrivers } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	build: {
		client: './',
		server: './_worker.js',
	},
	session: {
		// This app uses custom JWT auth, use lruCache to prevent auto KV binding
		driver: sessionDrivers.lruCache(),
	},
	adapter: cloudflare({
		imageService: 'compile',
		platformProxy: {
			enabled: true,
		},
	}),
});
