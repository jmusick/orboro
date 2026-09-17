// @ts-check
import { defineConfig } from 'astro/config';
import { sessionDrivers } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
	site: 'https://orboro.net',
	output: 'server',
	build: {
		client: './',
		server: './_worker.js',
		// Nonce-based CSP needs every inline <style>/<script> to be one we
		// authored (and can attach a nonce to) — never let Astro's own
		// component styles get auto-inlined depending on their size.
		inlineStylesheets: 'never',
	},
	session: {
		// This app uses custom JWT auth, use lruCache to prevent auto KV binding
		driver: sessionDrivers.lruCache(),
	},
	adapter: cloudflare({
		imageService: 'compile',
	}),
});
