import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from './appError';

type Handler<Args extends unknown[]> = (...args: Args) => Promise<Response>;

export function withErrorHandling<Args extends unknown[]>(
  handler: Handler<Args>
): Handler<Args> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { message: 'Validation failed', errors: error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      if (error instanceof AppError) {
        return NextResponse.json({ message: error.message }, { status: error.statusCode });
      }
      if (error instanceof Error && error.name === 'CastError') {
        return NextResponse.json({ message: 'Invalid id' }, { status: 400 });
      }
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: unknown }).code === 11000
      ) {
        return NextResponse.json(
          { message: 'A record with that value already exists' },
          { status: 409 }
        );
      }
      console.error(error);
      return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
    }
  };
}
