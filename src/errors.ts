export const ApiErrorCode = {
  AUTH: 'AUTH',
  RATE_LIMIT: 'RATE_LIMIT',
  VALIDATION: 'VALIDATION',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  API: 'API',
  NETWORK: 'NETWORK',
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

const HTTP_STATUS: Record<ApiErrorCode, number> = {
  AUTH: 401,
  RATE_LIMIT: 429,
  VALIDATION: 400,
  NOT_IMPLEMENTED: 501,
  API: 502,
  NETWORK: 502,
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: ApiErrorCode,
    message: string,
    options?: { httpStatus?: number; details?: Record<string, unknown> }
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.httpStatus = options?.httpStatus ?? HTTP_STATUS[code];
    this.details = options?.details;
  }

  static isApiError(error: unknown): error is ApiError {
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
  readonly retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(ApiErrorCode.RATE_LIMIT, message, {
      details: retryAfter !== undefined ? { retryAfter } : undefined,
    });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, options?: { httpStatus?: number; details?: Record<string, unknown> }) {
    super(ApiErrorCode.VALIDATION, message, options);
    this.name = 'ValidationError';
  }
}

export function errorFromHttpResponse(
  status: number,
  message: string,
  options?: { upstreamCode?: string; retryAfter?: number }
): ApiError {
  const details = options?.upstreamCode ? { upstreamCode: options.upstreamCode } : undefined;
  if (status === 401) return new AuthenticationError(message);
  if (status === 429) return new RateLimitError(message, options?.retryAfter);
  if (status >= 400 && status < 500) {
    return new ValidationError(message, { httpStatus: status, details });
  }
  return new ApiError(ApiErrorCode.API, message, { httpStatus: status, details });
}
