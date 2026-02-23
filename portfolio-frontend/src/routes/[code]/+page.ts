import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const ssr = false;

const redirectHome = (reason: string): never => {
	throw redirect(307, `/?error=${encodeURIComponent(reason)}`);
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseResponsePayload = async (response: Response): Promise<unknown> => {
	const contentType = response.headers.get('content-type') ?? '';
	if (contentType.includes('application/json')) {
		return response.json();
	}

	const text = await response.text();
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
};

const extractErrorMessage = (payload: unknown): string => {
	if (payload && typeof payload === 'object') {
		const maybeError = (payload as Record<string, unknown>).error;
		if (typeof maybeError === 'string') return maybeError;
	}
	return '';
};

const mapErrorToReason = (message: string): string => {
	const normalized = message.toLowerCase();
	if (normalized.includes('expired')) return 'code_expired';
	if (normalized.includes('not found')) return 'code_not_found';
	if (normalized.includes('exhausted') || normalized.includes('no views') || normalized.includes('view')) {
		return 'views_exhausted';
	}
	return 'code_invalid';
};

type LoadFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const fetchWithRetry = async (
	fetchFn: LoadFetch,
	url: string,
	attempts = 2
): Promise<Response> => {
	for (let attempt = 1; attempt <= attempts; attempt += 1) {
		try {
			return await fetchFn(url);
		} catch (error) {
			if (attempt === attempts) throw error;
			await wait(2000);
		}
	}
	throw new Error('Failed to fetch');
};

export const load: PageLoad = async ({ params, fetch }) => {
	const code = (params.code ?? '').trim();
	const isValidCode = /^[A-Za-z0-9]{6}$/.test(code);

	if (!isValidCode) {
		redirectHome('invalid_code');
	}

	const safeResponse = await fetchWithRetry(fetch, `http://127.0.0.1:5000/${encodeURIComponent(code)}`).catch(
		() => redirectHome('service_unavailable')
	);

	let payload: unknown;
	try {
		payload = await parseResponsePayload(safeResponse);
	} catch (error) {
		console.log('typeof payload:', typeof payload);
		console.log('payload:', payload);
		console.error('Error parsing response payload:', error);
		redirectHome('bad_response');
	}

	if (!safeResponse.ok) {
		const reason = mapErrorToReason(extractErrorMessage(payload));
		redirectHome(reason);
	}

	if (payload === null) {
		redirectHome('views_exhausted');
	}

	const envelope = payload as
		| {
				code?: unknown;
				data?: unknown;
				available_views?: unknown;
				error?: unknown;
		  }
		| null;

	if (!envelope || typeof envelope !== 'object') {
		redirectHome('bad_response');
	}
	const normalizedEnvelope = envelope as {
		code?: unknown;
		data?: unknown;
		available_views?: unknown;
		error?: unknown;
	};

	if (typeof normalizedEnvelope.error === 'string') {
		redirectHome(mapErrorToReason(normalizedEnvelope.error));
	}

	if (!normalizedEnvelope.data || typeof normalizedEnvelope.data !== 'object') {
		redirectHome('views_exhausted');
	}

	return {
		code,
		payload: normalizedEnvelope,
		errorMessage: null
	};
};
