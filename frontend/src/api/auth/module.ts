import type {ErrorResponse} from "../base.ts";
import type {AuthResponse, AuthRequest} from "./types.ts";
import axios, {type AxiosInstance} from "axios";
import {config} from "../../config.ts";


export class AuthService {
    private userAuthRequest: AuthRequest;
    private apiClient: AxiosInstance;

    constructsor(userAuthRequest: AuthRequest) {
        this.userAuthRequest = userAuthRequest;

        this.apiClient = axios.create({
            baseURL: config.baseUrl,
            withCredentials: false,
            headers: { "Content-Type": "application/json" },
        })
    }

    // @ts-ignore
    async login(): Promise<AuthResponse | ErrorResponse> {
        const response = await this.apiClient.post<AuthRequest>(config.authUrl, this.userAuthRequest);
        if (response.status === 200) {

        } else {

        }
    }
}