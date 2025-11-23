import type { ErrorResponse } from "../base.ts";
import axios, { type AxiosInstance } from "axios";
import { config } from "../../config.ts";
import type {FindCompanyResponse, TickerApiResponse} from "./types.ts";


export class StockDataService {
    private apiClient: AxiosInstance;

    constructor(token: string) {
        this.apiClient = axios.create({
            baseURL: config.baseUrl,
            withCredentials: false,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
    }

    async getTickerData(
        ticker: string,
        date_from: string,
        date_till: string,
        interval: number | string
    ): Promise<TickerApiResponse | ErrorResponse> {
        try {
            const res = await this.apiClient.get<TickerApiResponse>(config.dataUrl, {
                params: { ticker, date_from, date_till, interval },
            });
            return res.data;

        } catch (err: any) {
            return err.response.data.error;
        }
    }

    async findByCompanyName(company_name: string): Promise<FindCompanyResponse | ErrorResponse> {
        try {
            const res = await this.apiClient.get<FindCompanyResponse>(config.findUrl, {
                params: { company_name },
            });
            return res.data;

        } catch (err: any) {
            return err.response.data.error;
        }
    }
}
