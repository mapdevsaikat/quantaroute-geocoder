export const ApiErrorCode = {
    AUTH: 'AUTH',
    RATE_LIMIT: 'RATE_LIMIT',
    VALIDATION: 'VALIDATION',
    NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
    API: 'API',
    NETWORK: 'NETWORK',
};
const HTTP_STATUS = {
    AUTH: 401,
    RATE_LIMIT: 429,
    VALIDATION: 400,
    NOT_IMPLEMENTED: 501,
    API: 502,
    NETWORK: 502,
};
export class ApiError extends Error {
    code;
    httpStatus;
    details;
    constructor(code, message, options) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.httpStatus = options?.httpStatus ?? HTTP_STATUS[code];
        this.details = options?.details;
    }
    static isApiError(error) {
        return error instanceof ApiError;
    }
}
export class AuthenticationError extends ApiError {
    constructor(message = 'Invalid or missing API key') {
        super(ApiErrorCode.AUTH, message);
        this.name = 'AuthenticationError';
    }
}
export class RateLimitError extends ApiError {
    retryAfter;
    constructor(message = 'Rate limit exceeded', retryAfter) {
        super(ApiErrorCode.RATE_LIMIT, message, {
            details: retryAfter !== undefined ? { retryAfter } : undefined,
        });
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}
export class ValidationError extends ApiError {
    constructor(message, options) {
        super(ApiErrorCode.VALIDATION, message, options);
        this.name = 'ValidationError';
    }
}
export function errorFromHttpResponse(status, message, options) {
    const details = options?.upstreamCode ? { upstreamCode: options.upstreamCode } : undefined;
    if (status === 401)
        return new AuthenticationError(message);
    if (status === 429)
        return new RateLimitError(message, options?.retryAfter);
    if (status >= 400 && status < 500) {
        return new ValidationError(message, { httpStatus: status, details });
    }
    return new ApiError(ApiErrorCode.API, message, { httpStatus: status, details });
}
//# sourceMappingURL=errors.js.map