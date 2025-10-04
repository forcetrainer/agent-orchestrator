/**
 * Error handling utilities for API routes
 *
 * This module provides:
 * - Custom error classes with HTTP status codes
 * - Centralized error handling for consistent API responses
 * - Server-side error logging with full stack traces
 * - User-friendly error messages without internal details
 */

import { NextResponse } from 'next/server';
import { ApiResponse } from '@/types/api';

/**
 * Base error class for operational errors with HTTP status codes
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = this.constructor.name;
  }
}

/**
 * Validation error for client-side input errors
 * Always returns HTTP 400 Bad Request
 */
export class ValidationError extends AppError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(400, message);
    this.field = field;
  }
}

/**
 * Not found error for missing resources
 * Always returns HTTP 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message);
  }
}

/**
 * Centralized error handler for API routes
 * Logs full error details server-side and returns user-friendly response
 *
 * @param error - Any error thrown in the API route
 * @returns NextResponse with standardized ApiResponse format
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse<never>> {
  // Log full error details server-side
  const timestamp = new Date().toISOString();
  console.error('[API Error]', {
    timestamp,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    type: error instanceof AppError ? error.constructor.name : 'UnexpectedError',
  });

  // Determine status code and message for client response
  if (error instanceof AppError) {
    // Operational errors: return the error message and status code
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: error.message,
        code: error.statusCode,
      },
      { status: error.statusCode }
    );
  }

  // Unexpected errors: return generic message without internal details
  return NextResponse.json<ApiResponse<never>>(
    {
      success: false,
      error: 'An unexpected error occurred. Please try again later.',
      code: 500,
    },
    { status: 500 }
  );
}
