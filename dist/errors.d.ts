export declare const ApiErrorCode: {
    readonly AUTH: "AUTH";
    readonly RATE_LIMIT: "RATE_LIMIT";
    readonly VALIDATION: "VALIDATION";
    readonly NOT_IMPLEMENTED: "NOT_IMPLEMENTED";
    readonly API: "API";
    readonly NETWORK: "NETWORK";
};
export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];
export declare class ApiError extends Error {
    readonly code: ApiErrorCode;
    readonly httpStatus: number;
    readonly details?: Record<string, unknown>;
    constructor(code: ApiErrorCode, message: string, options?: {
        httpStatus?: number;
        details?: Record<string, unknown>;
    });
    static isApiError(error: unknown): error is ApiError;
}
export declare class AuthenticationError extends ApiError {
    constructor(message?: string);
}
export declare class RateLimitError extends ApiError {
    readonly retryAfter?: number;
    constructor(message?: string, retryAfter?: number);
}
export declare class ValidationError extends ApiError {
    constructor(message: string, options?: {
        httpStatus?: number;
        details?: Record<string, unknown>;
    });
}
export declare function errorFromHttpResponse(status: number, message: string, options?: {
    upstreamCode?: string;
    retryAfter?: number;
}): ApiError;
//# sourceMappingURL=errors.d.ts.map