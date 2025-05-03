'use client';

import {QueryClientProvider} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import {queryClient} from '@/lib/reactQuery';
import {ReactNode, useEffect} from 'react';
import {setupCacheCleanup} from '@/lib/cacheCleanup';
import {clearExpiredExchangeRates, initExchangeRateCache} from "@/lib/cache/exchangeCache";

export function ClientProviders({children}: { children: ReactNode }) {
    useEffect(() => {
        initExchangeRateCache();

        const setupAllCaches = async () => {
            await setupCacheCleanup();
            clearExpiredExchangeRates();

            const exchangeRateInterval = setInterval(() => {
                clearExpiredExchangeRates();
            }, 3600000);

            return () => {
                clearInterval(exchangeRateInterval);
            };
        };

        const cleanup = setupAllCaches();

        return () => {
            cleanup.then(cleanupFn => cleanupFn());
        };
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false}/>}
        </QueryClientProvider>
    );
}