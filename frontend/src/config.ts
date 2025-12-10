type AppConfig = {
    baseUrl: string;
    authUrl: string;
    dataUrl: string;
    findUrl: string;
}

export const config: AppConfig = {
    baseUrl: (import.meta.env.VITE_BASE_URL as string),
    authUrl: (import.meta.env.VITE_BACKEND_AUTH_PATH as string),
    dataUrl: (import.meta.env.VITE_BACKEND_TICKER_DATA_PATH as string),
    findUrl: (import.meta.env.VITE_BACKEND_FIND_TICKER_PATH as string),
}