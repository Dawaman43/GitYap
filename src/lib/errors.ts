

import type { ApiError } from './types';

export class AppError extends Error {

	public readonly code: string;

	public readonly status: number;

	public readonly details?: Record<string, unknown>;


	constructor(
		message: string,
		code: string,
		status: number,
		details?: Record<string, unknown>
	) {
		super(message);
		this.name = this.constructor.name;
		this.code = code;
		this.status = status;
		this.details = details;


		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}


	toApiError(): ApiError {
		return {
			code: this.code,
			message: this.message,
			status: this.status,
			details: this.details
		};
	}
}

export class NotFoundError extends AppError {
	constructor(resource: string, identifier: string) {
		super(
			`${resource} not found: ${identifier}`,
			'NOT_FOUND',
			404,
			{ resource, identifier }
		);
	}
}

export class ValidationError extends AppError {
	constructor(message: string, field?: string, value?: unknown) {
		super(
			message,
			'VALIDATION_ERROR',
			400,
			field ? { field, value } : undefined
		);
	}
}

export class ConflictError extends AppError {
	constructor(resource: string, identifier: string) {
		super(
			`${resource} already exists: ${identifier}`,
			'CONFLICT',
			409,
			{ resource, identifier }
		);
	}
}

export class ExternalApiError extends AppError {
	constructor(
		service: string,
		message: string,
		statusCode?: number,
		retryable: boolean = false
	) {
		super(
			`${service} API error: ${message}`,
			'EXTERNAL_API_ERROR',
			502,
			{ service, originalStatus: statusCode, retryable }
		);
	}
}

export class DatabaseError extends AppError {
	constructor(operation: string, details?: Record<string, unknown>) {
		super(
			`Database error during ${operation}`,
			'DATABASE_ERROR',
			500,
			{ operation, ...details }
		);
	}
}

export class RateLimitError extends AppError {
	constructor(limit: number, windowSeconds: number) {
		super(
			`Rate limit exceeded. Maximum ${limit} requests per ${windowSeconds} seconds.`,
			'RATE_LIMIT_EXCEEDED',
			429,
			{ limit, windowSeconds }
		);
	}
}

export class AuthError extends AppError {
	constructor(message: string = 'Authentication required') {
		super(message, 'UNAUTHORIZED', 401);
	}
}

export enum ErrorCode {
	NOT_FOUND = 'NOT_FOUND',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	CONFLICT = 'CONFLICT',
	EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
	DATABASE_ERROR = 'DATABASE_ERROR',
	RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
	UNAUTHORIZED = 'UNAUTHORIZED',
	INTERNAL_ERROR = 'INTERNAL_ERROR'
}
