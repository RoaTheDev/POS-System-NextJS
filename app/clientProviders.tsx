'use client';

import {QueryClientProvider} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import {queryClient} from '@/lib/reactQuery';
import {ReactNode, useEffect} from 'react';
import {setupCacheCleanup} from '@/lib/cacheCleanup';
import {initExchangeRateCache} from "@/lib/cache/exchangeCache";

export function ClientProviders({children}: { children: ReactNode }) {
    useEffect(() => {
        initExchangeRateCache();

        let cleanupFn: (() => void) | null = null;
        setupCacheCleanup().then(fn => {
            cleanupFn = fn;
        }).catch(err => {
            console.error('Failed to setup cache cleanup:', err);
        });

        return () => {
            if (cleanupFn) {
                cleanupFn();
            }
        };
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false}/>}
        </QueryClientProvider>
    );
}