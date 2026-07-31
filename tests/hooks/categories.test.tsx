// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '@/redux/store';
import { useCategories, useCreateCategory } from '@/features/categories/hooks';

vi.mock('@/http/http', () => ({
  API: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const store = makeStore();
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>{children}</Provider>
    </QueryClientProvider>
  );
}

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the categories fetched from GET /category', async () => {
    const { API } = await import('@/http/http');
    vi.mocked(API.get).mockResolvedValue({
      data: { data: [{ _id: '1', name: 'Design', slug: 'design', description: '' }] },
    });

    const { result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].name).toBe('Design');
    expect(API.get).toHaveBeenCalledWith('/category');
  });
});

describe('useCreateCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POSTs the new category and reports success', async () => {
    const { API } = await import('@/http/http');
    vi.mocked(API.post).mockResolvedValue({
      data: { data: { _id: '2', name: 'Marketing', slug: 'marketing', description: '' } },
    });

    const { result } = renderHook(() => useCreateCategory(), { wrapper });
    result.current.mutate({ name: 'Marketing', description: '' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(API.post).toHaveBeenCalledWith('/category', { name: 'Marketing', description: '' });
  });

  it('surfaces a failure via isError instead of throwing', async () => {
    const { API } = await import('@/http/http');
    vi.mocked(API.post).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useCreateCategory(), { wrapper });
    result.current.mutate({ name: 'Marketing', description: '' });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
