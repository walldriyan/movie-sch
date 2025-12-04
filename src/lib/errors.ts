/**
 * Production-ready Error Handling Library
 * Provides consistent error handling across the application
 */

// Error types for different scenarios
export enum ErrorType {
    VALIDATION = 'VALIDATION_ERROR',
    AUTHENTICATION = 'AUTHENTICATION_ERROR',
    AUTHORIZATION = 'AUTHORIZATION_ERROR',
    NOT_FOUND = 'NOT_FOUND_ERROR',
    RATE_LIMIT = 'RATE_LIMIT_ERROR',
    DATABASE = 'DATABASE_ERROR',
    NETWORK = 'NETWORK_ERROR',
    INTERNAL = 'INTERNAL_ERROR',
    EXTERNAL_SERVICE = 'EXTERNAL_SERVICE_ERROR',
}

// Base application error
export class AppError extends Error {
    public readonly type: ErrorType;
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly context?: Record<string, unknown>;

    constructor(
        message: string,
        type: ErrorType = ErrorType.INTERNAL,
        statusCode: number = 500,
        isOperational: boolean = true,
        context?: Record<string, unknown>
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);

        this.type = type;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.context = context;

        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            error: this.type,
            message: this.message,
            statusCode: this.statusCode,
            ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
        };
    }
}

// Specific error classes
export class ValidationError extends AppError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, ErrorType.VALIDATION, 400, true, context);
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(message, ErrorType.AUTHENTICATION, 401, true);
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = 'Permission denied') {
        super(message, ErrorType.AUTHORIZATION, 403, true);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, ErrorType.NOT_FOUND, 404, true);
    }
}

export class RateLimitError extends AppError {
    public readonly retryAfter: number;

    constructor(retryAfter: number = 60) {
        super('Too many requests', ErrorType.RATE_LIMIT, 429, true);
        this.retryAfter = retryAfter;
    }
}

export class DatabaseError extends AppError {
    constructor(message: string = 'Database operation failed', context?: Record<string, unknown>) {
        super(message, ErrorType.DATABASE, 500, true, context);
    }
}

// Error response format
export interface ErrorResponse {
    success: false;
    error: {
        type: string;
        message: string;
        code?: string;
        details?: unknown;
    };
}

// Success response format
export interface SuccessResponse<T> {
    success: true;
    data: T;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}

// Union type for all responses
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Create a standard success response
 */
export function successResponse<T>(data: T, meta?: SuccessResponse<T>['meta']): SuccessResponse<T> {
    return {
        success: true,
        data,
        ...(meta && { meta }),
    };
}

/**
 * Create a standard error response
 */
export function errorResponse(
    message: string,
    type: string = 'ERROR',
    code?: string,
    details?: unknown
): ErrorResponse {
    return {
        success: false,
        error: {
            type,
            message,
            ...(code && { code }),
            ...(details && { details }),
        },
    };
}

/**
 * Handle errors and return appropriate response
 */
export function handleError(error: unknown): ErrorResponse {
    // Log the error
    console.error('[Error Handler]', error);

    // AppError - operational error
    if (error instanceof AppError) {
        return errorResponse(error.message, error.type);
    }

    // Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as { code: string; message: string; meta?: unknown };

        switch (prismaError.code) {
            case 'P2002':
                return errorResponse('A record with this value already exists', ErrorType.VALIDATION, 'UNIQUE_CONSTRAINT');
            case 'P2025':
                return errorResponse('Record not found', ErrorType.NOT_FOUND, 'RECORD_NOT_FOUND');
            case 'P2003':
                return errorResponse('Related record not found', ErrorType.VALIDATION, 'FOREIGN_KEY_CONSTRAINT');
            default:
                return errorResponse('Database operation failed', ErrorType.DATABASE, prismaError.code);
        }
    }

    // Standard Error
    if (error instanceof Error) {
        // Don't expose internal error messages in production
        const message = process.env.NODE_ENV === 'development'
            ? error.message
            : 'An unexpected error occurred';

        return errorResponse(message, ErrorType.INTERNAL);
    }

    // Unknown error format
    return errorResponse('An unexpected error occurred', ErrorType.INTERNAL);
}

/**
 * Async error wrapper for server actions
 */
export async function safeAction<T>(
    action: () => Promise<T>,
    errorMessage?: string
): Promise<ApiResponse<T>> {
    try {
        const result = await action();
        return successResponse(result);
    } catch (error) {
        console.error('[Safe Action Error]', error);

        if (error instanceof AppError) {
            return errorResponse(error.message, error.type);
        }

        return errorResponse(
            errorMessage || 'An unexpected error occurred',
            ErrorType.INTERNAL
        );
    }
}

/**
 * Retry wrapper for unreliable operations
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    options: {
        retries?: number;
        delay?: number;
        backoff?: number;
        onRetry?: (attempt: number, error: Error) => void;
    } = {}
): Promise<T> {
    const { retries = 3, delay = 1000, backoff = 2, onRetry } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt === retries) {
                throw lastError;
            }

            if (onRetry) {
                onRetry(attempt, lastError);
            }

            const waitTime = delay * Math.pow(backoff, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    throw lastError!;
}

/**
 * Validate required fields
 */
export function validateRequired(
    data: Record<string, unknown>,
    requiredFields: string[]
): void {
    const missing = requiredFields.filter(
        field => data[field] === undefined || data[field] === null || data[field] === ''
    );

    if (missing.length > 0) {
        throw new ValidationError(
            `Missing required fields: ${missing.join(', ')}`,
            { missing }
        );
    }
}
