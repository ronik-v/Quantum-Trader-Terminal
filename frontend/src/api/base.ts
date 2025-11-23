export interface ErrorResponse {
    type: string;
    message: string;
}

export interface ApiErrorResponse {
    error: ErrorResponse;
}