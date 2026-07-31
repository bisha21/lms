import { describe, expect, it } from 'vitest';
import { AppError } from '@/lib/appError';

describe('AppError', () => {
  it('carries a statusCode alongside the message', () => {
    const error = new AppError('Not found', 404);
    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe('AppError');
    expect(error).toBeInstanceOf(Error);
  });
});
