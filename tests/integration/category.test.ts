import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { createConnection } from '@/database/db';
import Category from '@/database/models/category';
import { createCategory, getAllCategory } from '@/app/api/category/category.controller';
import { mockGetServerSession } from '../setup';

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/category', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('category controller', () => {
  beforeEach(async () => {
    await createConnection();
  });

  it('rejects creation with no session at all (401)', async () => {
    mockGetServerSession.mockResolvedValue(null);

    await expect(createCategory(postRequest({ name: 'Web Development' }))).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it.each([['instructor'], ['student']])(
    'rejects creation for an authenticated %s (403, not 401 or a filtered 200)',
    async (role) => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user-1', role } });

      await expect(createCategory(postRequest({ name: 'Web Development' }))).rejects.toMatchObject({
        statusCode: 403,
      });
      expect(await Category.countDocuments({})).toBe(0);
    },
  );

  it.each([['super_admin'], ['admin']])('creates a category and auto-generates its slug as %s', async (role) => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'admin-1', role } });

    const response = await createCategory(postRequest({ name: 'Web Development' }));
    expect(response.status).toBe(201);

    const stored = await Category.findOne({ name: 'Web Development' });
    expect(stored?.slug).toBe('web-development');
  });

  it('rejects a duplicate category name', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    await Category.create({ name: 'Web Development' });

    await expect(createCategory(postRequest({ name: 'Web Development' }))).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('lists all categories without requiring a session', async () => {
    await Category.create({ name: 'Design' });

    const response = await getAllCategory();
    const body = await response.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('Design');
  });
});
