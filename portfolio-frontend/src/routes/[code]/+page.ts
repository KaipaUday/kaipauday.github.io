import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ params, fetch }) => {
	const code = (params.code ?? '').trim();
	const isValidCode = /^[A-Za-z0-9]{6}$/.test(code);

	if (!isValidCode) {
		throw redirect(307, '/');
	}

	try {
		const response = await fetch(`https://udaykaipa.pythonanywhere.com/${encodeURIComponent(code)}`);
		if (!response.ok) {
			throw redirect(307, '/');
		}

		const contentType = response.headers.get('content-type') ?? '';
		let payload: unknown;

		if (contentType.includes('application/json')) {
			payload = await response.json();
		} else {
			const text = await response.text();
			try {
				payload = JSON.parse(text);
			} catch {
				throw redirect(307, '/');
			}
		}

		const envelope = payload as
			| {
					code?: unknown;
					data?: unknown;
					available_views?: unknown;
			  }
			| null;

		if (!envelope || typeof envelope !== 'object' || !envelope.data || typeof envelope.data !== 'object') {
			throw redirect(307, '/');
		}

		return {
			code,
			payload: envelope,
			errorMessage: null
		};
	} catch {
		throw redirect(307, '/');
	}
};
