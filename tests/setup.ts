import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// Shared across every integration test: controllers call getServerSession() (directly,
// or via requireAuth()/authMiddleware()) to identify the caller. Mocking it once here
// means individual test files just call `mockGetServerSession.mockResolvedValue(...)`
// instead of each re-declaring `vi.mock('next-auth', ...)`.
export const mockGetServerSession = vi.fn();

vi.mock('next-auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-auth')>();
  return {
    ...actual,
    getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
  };
});

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGOOSE_URI = mongod.getUri();
});

afterEach(async () => {
  mockGetServerSession.mockReset();
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
