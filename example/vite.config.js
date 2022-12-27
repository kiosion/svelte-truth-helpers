import { sveltekit } from '@sveltejs/kit/vite';
import inspect from 'vite-plugin-inspect';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [
		sveltekit(),
		inspect()
	]
};

export default config;
