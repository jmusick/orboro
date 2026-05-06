// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	session: {
		// Prevent the Cloudflare adapter from auto-adding a SESSION KV binding.
		// This app uses custom JWT auth and does not use Astro sessions.
		driver: 'memory',
	},
	adapter: cloudflare({
		imageService: 'passthrough',
		platformProxy: {
			enabled: true,
		},
	}),
});
