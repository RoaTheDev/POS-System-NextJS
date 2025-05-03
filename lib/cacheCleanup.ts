import { queryClient } from './reactQuery';
import { clearExpiredImagesFromCache } from './cache/imageCache';
import { clearExpiredExchangeRates } from './cache/exchangeCache';

const INACTIVE_CACHE_TTL = 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL = 12 * 60 * 60 * 1000;

let isCleanupSetup = false;

export const setupCacheCleanup = async () => {
    if (typeof window === 'undefined' || isCleanupSetup) {
        return () => {};
    }

    isCleanupSetup = true;

    const cleanupReactQueryCache = async () => {
        console.log('Cleaning up React Query cache...');
        await queryClient.invalidateQueries({
            predicate: (query) => {
                const lastUpdated = query.state.dataUpdatedAt;
                return Date.now() - lastUpdated > INACTIVE_CACHE_TTL;
            },
        });
    };

    const cleanupImageCache = async () => {
        console.log('Cleaning up image cache...');
        await clearExpiredImagesFromCache();
    };

    const cleanupExchangeRateCache = async () => {
        console.log('Cleaning up exchange rate cache...');
        await clearExpiredExchangeRates();
    };

    const cleanupAllCaches = async () => {
        await Promise.all([
            cleanupReactQueryCache(),
            cleanupImageCache(),
            cleanupExchangeRateCache(),
        ]);
    };

    await cleanupAllCaches();

    const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible') {
            await cleanupAllCaches();
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intervalId = setInterval(async () => {
        await cleanupAllCaches();
    }, CLEANUP_INTERVAL);

    return () => {
        isCleanupSetup = false;
        clearInterval(intervalId);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
};