'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/reactQuery';
import { ReactNode, useEffect } from 'react';
import { setupCacheCleanup } from '@/lib/cacheCleanup';

export function ClientProviders({ children }: { children: ReactNode }) {
    useEffect(() => {
        setupCacheCleanup().then(r => r);
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    );
}