export interface AuthRequest {
    username: string;
    password: string;
}

export interface AuthResponse {
    username: string;
    token: string;
}

export interface ApiAuthResponse {
    data: { username: string };
    meta: { token: string };
}