import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

const rawBasePath = process.env.BASE_PATH ?? '';
const normalizedBasePath =
	rawBasePath === ''
		? ''
		: `/${rawBasePath.replace(/^\/+|\/+$/g, '')}`;

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: preprocess(),

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			// Keep SPA shell at root index; copy to 404.html in build scripts for GH deep links.
			fallback: 'index.html'
		}),
		paths: {
			base: normalizedBasePath
		}
	}
};

export default config;
