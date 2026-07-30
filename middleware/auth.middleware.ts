import { authOptions } from '@/app/api/auth/[...nextauth]/route';
// @ts-expect-error - next-auth v4's type declarations don't resolve this named export
// under this project's moduleResolution, though it exists at runtime.
import { getServerSession, Session } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/lib/appError';

const authMiddleware = async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return Response.json(
      {
        messsage: 'You dont have permission to perform this action',
      },
      { status: 401 },
    );
  }
  return NextResponse.next();
};

export default authMiddleware;

// Throws (rather than returning a sentinel) so callers can rely on `catchAsync`
// to format the response, and get back a real Session with no extra narrowing.
export const requireAuth = async (): Promise<Session> => {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new AppError('You must be logged in', 401);
  }
  return session;
};
