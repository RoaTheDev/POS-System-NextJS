import {queryClient} from './reactQuery';
import {clearExpiredImagesFromCache} from './cache/imageCache';

const INACTIVE_CACHE_TTL = 24 * 60 * 60 * 1000;

export const setupCacheCleanup = async  () => {
    if (typeof window === 'undefined') return;

    const cleanupReactQueryCache = () => {
        queryClient.invalidateQueries({
            predicate: (query) => {
                const lastUpdated = query.state.dataUpdatedAt;
                return Date.now() - lastUpdated > INACTIVE_CACHE_TTL;
            },
        });
    };

    const cleanupImageCache = async () => {
        await clearExpiredImagesFromCache();
    };

    const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible') {
            cleanupReactQueryCache();
            await cleanupImageCache();
        }
    };

    cleanupReactQueryCache();
    await cleanupImageCache();

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intervalId = setInterval(async () => {
        cleanupReactQueryCache();
        await cleanupImageCache();
    }, 12 * 60 * 60 * 1000);

    window.addEventListener('beforeunload', () => {
        clearInterval(intervalId);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    });
};