type AppConfig = {
    baseUrl: string;
    authUrl: string;
    dataUrl: string;
    findUrl: string;
}

export const config: AppConfig = {
    baseUrl: import.meta.env.BASE_URL,
    authUrl: import.meta.env.BACKEND_AUTH_PATH,
    dataUrl: import.meta.env.BACKEND_TICKER_DATA_PATH,
    findUrl: import.meta.env.BACKEND_FIND_TICKER_PATH,
}