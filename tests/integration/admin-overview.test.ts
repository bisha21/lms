import { beforeEach, describe, expect, it } from 'vitest';
import { createConnection } from '@/database/db';
import { getOverview } from '@/app/api/admin/overview.controller';
import { mockGetServerSession } from '../setup';

describe('admin overview controller', () => {
  beforeEach(async () => {
    await createConnection();
  });

  it('rejects with no session at all (401)', async () => {
    mockGetServerSession.mockResolvedValue(null);
    await expect(getOverview()).rejects.toMatchObject({ statusCode: 401 });
  });

  it.each([['instructor'], ['student']])('rejects an authenticated %s (403)', async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1', role } });
    await expect(getOverview()).rejects.toMatchObject({ statusCode: 403 });
  });

  it.each([['super_admin'], ['admin']])('allows %s (200)', async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'admin-1', role } });
    const response = await getOverview();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
  });
});
