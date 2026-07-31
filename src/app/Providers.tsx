'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import StoreProvider from './StoreProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  // One QueryClient per mount (not module-level) — same reasoning as makeStore()
  // for the Redux store: avoids leaking cached data between requests/users on the server.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>{children}</StoreProvider>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
