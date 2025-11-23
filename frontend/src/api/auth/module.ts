import type {ApiErrorResponse, ErrorResponse} from "../base.ts";
import type {ApiAuthResponse, AuthRequest, AuthResponse} from "./types.ts";
import axios, { type AxiosInstance } from "axios";
import { config } from "../../config.ts";

export class AuthService {
    private readonly userAuthRequest: AuthRequest;
    private apiClient: AxiosInstance;

    constructor(userAuthRequest: AuthRequest) {
        this.userAuthRequest = userAuthRequest;
        this.apiClient = axios.create({
            baseURL: config.baseUrl,
            withCredentials: false,
            headers: { "Content-Type": "application/json" },
        });
    }

    async login(): Promise<AuthResponse | ErrorResponse> {
        try {
            const response = await this.apiClient.post<ApiAuthResponse>(config.authUrl, this.userAuthRequest);
            return {
                username: response.data.data.username,
                token: response.data.meta.token,
            };
        } catch (err: any) {
            const apiErr = err.response?.data as ApiErrorResponse;
            return apiErr.error;
        }
    }
}
