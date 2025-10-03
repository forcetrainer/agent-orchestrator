/**
 * Tests for error handling utilities
 * Story 1.4: Error Handling Middleware
 */

import { NextResponse } from 'next/server';
import { AppError, ValidationError, NotFoundError, handleApiError } from '../errors';
import { ApiResponse } from '@/types/api';

// Mock console.error to prevent test output pollution
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Error Classes', () => {
  afterEach(() => {
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('AppError', () => {
    it('should create error with statusCode and message', () => {
      const error = new AppError(400, 'Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
    });

    it('should allow non-operational flag', () => {
      const error = new AppError(500, 'Programmer error', false);

      expect(error.isOperational).toBe(false);
    });

    it('should capture stack trace', () => {
      const error = new AppError(500, 'Test error');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });

  describe('ValidationError', () => {
    it('should extend AppError with 400 status code', () => {
      const error = new ValidationError('Invalid input');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('NotFoundError', () => {
    it('should extend AppError with 404 status code', () => {
      const error = new NotFoundError('Resource not found');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('NotFoundError');
    });
  });
});

describe('handleApiError', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15T10:00:00.000Z'));
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  it('should return NextResponse with correct status for ValidationError', () => {
    const error = new ValidationError('Missing required field');

    const response = handleApiError(error);

    expect(response.status).toBe(400);
    expect(response).toBeInstanceOf(Response);
  });

  it('should return NextResponse with correct status for NotFoundError', () => {
    const error = new NotFoundError('Agent not found');

    const response = handleApiError(error);

    expect(response.status).toBe(404);
    expect(response).toBeInstanceOf(Response);
  });

  it('should return NextResponse with correct status for AppError', () => {
    const error = new AppError(403, 'Forbidden');

    const response = handleApiError(error);

    expect(response.status).toBe(403);
    expect(response).toBeInstanceOf(Response);
  });

  it('should return 500 for unexpected errors', () => {
    const error = new Error('Unexpected system error');

    const response = handleApiError(error);

    expect(response.status).toBe(500);
    expect(response).toBeInstanceOf(Response);
  });

  it('should handle non-Error objects', () => {
    const error = 'String error';

    const response = handleApiError(error);

    expect(response.status).toBe(500);
    expect(response).toBeInstanceOf(Response);
  });
});
