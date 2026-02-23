import { browser } from '$app/environment';

const LOCAL_API_BASE_URL = 'http://127.0.0.1:5000';
const PROD_API_BASE_URL = 'https://udaykaipa.pythonanywhere.com/';

export const getApiBaseUrl = (): string => {
	if (!browser) return PROD_API_BASE_URL;
	return window.location.hostname === 'localhost' ? LOCAL_API_BASE_URL : PROD_API_BASE_URL;
};
