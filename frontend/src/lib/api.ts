const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

// Simple in-memory cache
const cache = new Map<string, { data: any, timestamp: number }>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export const apiClient = {
    async fetch(endpoint: string, options: RequestInit = {}, token?: string, useCache = false) {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const isGet = !options.method || options.method.toUpperCase() === 'GET';
        const cacheKey = `${cleanEndpoint}:${token || 'public'}`;

        // Return cached data if valid
        if (isGet && useCache) {
            const cached = cache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp < DEFAULT_TTL)) {
                console.log(`[API] Cache hit: ${cleanEndpoint}`);
                return cached.data;
            }
        }

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

        const data = await res.json();

        // Store in cache if it's a GET request
        if (isGet) {
            cache.set(cacheKey, { data, timestamp: Date.now() });
        }

        return data;
    },

    invalidateCache(endpoint?: string) {
        if (endpoint) {
            const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
            // Remove all entries starting with this endpoint (to handle different tokens)
            for (const key of cache.keys()) {
                if (key.startsWith(`${cleanEndpoint}:`)) {
                    cache.delete(key);
                }
            }
            console.log(`[API] Cache invalidated for: ${cleanEndpoint}`);
        } else {
            cache.clear();
            console.log(`[API] Entire cache cleared`);
        }
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
