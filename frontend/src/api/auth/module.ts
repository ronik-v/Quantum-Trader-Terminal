import type { ApiErrorResponse, ErrorResponse } from "../base";
import type { ApiAuthResponse, AuthRequest, AuthResponse } from "./types";
import axios, { type AxiosInstance } from "axios";
import {config} from "../../config";

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
            const resp = await this.apiClient.post<ApiAuthResponse>(config.authUrl, this.userAuthRequest);
            const d = resp?.data as ApiAuthResponse | undefined;

            if (d && d.meta && typeof d.meta.token === "string" && d.data && typeof d.data.username === "string") {
                return {
                    username: String(d.data.username),
                    token: String(d.meta.token),
                } as AuthResponse;
            }

            return { type: "invalid_response", message: "Invalid server response" };
        } catch (err: any) {
            const apiErr = err?.response?.data as ApiErrorResponse | undefined;
            if (apiErr?.error && typeof apiErr.error.message === "string") {
                return {
                    type: String(apiErr.error.type ?? "api_error"),
                    message: String(apiErr.error.message),
                };
            }
            return { type: "network_error", message: String(err?.message ?? "Network or server error") };
        }
    }
}
