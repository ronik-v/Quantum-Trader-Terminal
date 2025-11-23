export interface TickerData {
    open: number[];
    high: number[];
    low: number[];
    value: number[];
    volume: number[];
    begin: string[];
    end: string[];
}

export interface GarchModel {
    upper: number[];
    lower: number[];
    sigma: number[];
    sigma_next: number;
}

export interface Models {
    arima?: number[];
    sma_5?: number[];
    sma_12?: number[];
    garch?: GarchModel;
    [key: string]: any;
}

export interface TickerApiResponse {
    data: {
        ticker: TickerData;
        models: Models;
    };
    prediction?: {
        next_price: number;
        price_diff: number;
    };
}

export interface FindCompanyResponse {
    ticker: string;
    company_name: string;
    short_company_name: string;
}