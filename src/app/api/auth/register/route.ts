import { createConnection } from '@/database/db';
import User from '@/database/models/user.schema';
import { withErrorHandling } from '@/lib/catchAsync';
import { AppError } from '@/lib/appError';
import { registerSchema } from '@/lib/validate/auth.schema';
import { getClientIp, isRateLimited } from '@/lib/rateLimit';
import { NextResponse } from 'next/server';

export const POST = withErrorHandling(async (req: Request) => {
  if (isRateLimited(`register:${getClientIp(req)}`, 5, 60_000)) {
    throw new AppError('Too many requests, please try again later', 429);
  }

  await createConnection();
  const body = await req.json();
  const { username, email, password } = registerSchema.parse(body);

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('An account with that email already exists', 409);
  }

  const user = await User.create({ username, email, password });
  return NextResponse.json(
    { message: 'Account created', data: { id: user._id, email: user.email } },
    { status: 201 }
  );
});
