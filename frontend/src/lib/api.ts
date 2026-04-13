const RAW_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const BASE_URL = RAW_BASE_URL.replace(/\/$/, '');

export const apiClient = {
    async fetch(endpoint: string, options: RequestInit = {}, token?: string) {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const isGet = !options.method || options.method.toUpperCase() === 'GET';
        console.log(`[API] Fetching ${BASE_URL}${cleanEndpoint}`);

        const headers: Record<string, string> = {
            ...(!isGet && { 'Content-Type': 'application/json' }),
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${BASE_URL}${cleanEndpoint}`, {
            ...options,
            headers: {
                ...headers,
                ...options.headers,
            },
        });
        if (!res.ok) {
            console.error(`[API] Error ${res.status} on ${endpoint}`);
            throw new Error(`API Error: ${res.statusText}`);
        }
        return res.json();
    },

    async upload(endpoint: string, formData: FormData, token?: string) {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${BASE_URL}${cleanEndpoint}`, {
            method: 'POST',
            body: formData,
            headers,
        });
        if (!res.ok) throw new Error(`Upload Error: ${res.statusText}`);
        return res.json();
    }
};
