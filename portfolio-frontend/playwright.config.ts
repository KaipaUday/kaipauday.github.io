import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: { command: 'npm run build && npm run preview', port: 4173 },
	testDir: 'tests/e2e',
	use: {
		screenshot : "only-on-failure",
		trace :"retain-on-failure",
		video :"retain-on-failure",
	}
});
