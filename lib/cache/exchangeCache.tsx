import {DBSchema, IDBPDatabase, openDB} from 'idb';

interface ExchangeRateDB extends DBSchema {
    'exchange-rate-cache': {
        key: string; // e.g. "USD_KHR" or // "USD_THB"
        value: {
            rate: number;
            timestamp: number;
        };
    };
}

const RATE_EXPIRATION = 6 * 60 * 60 * 1000; // 6 hours

class ExchangeRateCache {
    private readonly dbPromise: Promise<IDBPDatabase<ExchangeRateDB>>;

    constructor() {
        this.dbPromise = openDB<ExchangeRateDB>('exchange-rate-db', 1, {
            upgrade(db) {
                db.createObjectStore('exchange-rate-cache');
            },
        });
    }

    async getRate(key: string): Promise<number | null> {
        try {
            const db = await this.dbPromise;
            const cachedRate = await db.get('exchange-rate-cache', key);

            if (!cachedRate) return null;

            if (Date.now() - cachedRate.timestamp > RATE_EXPIRATION) {
                await db.delete('exchange-rate-cache', key);
                return null;
            }

            return cachedRate.rate;
        } catch (error) {
            console.error('Error getting rate from cache:', error);
            return null;
        }
    }

    async setRate(key: string, rate: number): Promise<void> {
        try {
            const db = await this.dbPromise;
            await db.put('exchange-rate-cache', {rate, timestamp: Date.now()}, key);
        } catch (error) {
            console.error('Error setting rate in cache:', error);
        }
    }

    async clearExpiredRates(): Promise<void> {
        try {
            const db = await this.dbPromise;
            const keys = await db.getAllKeys('exchange-rate-cache');

            await Promise.all(
                keys.map(async (key) => {
                    const data = await db.get('exchange-rate-cache', key);
                    if (data && Date.now() - data.timestamp > RATE_EXPIRATION) {
                        await db.delete('exchange-rate-cache', key);
                    }
                })
            );
        } catch (error) {
            console.error('Error clearing expired exchange rates:', error);
        }
    }
}

const exchangeRateCache = typeof window !== 'undefined' ? new ExchangeRateCache() : null;

export const getCachedExchangeRate = async (key: string) => {
    return exchangeRateCache ? await exchangeRateCache.getRate(key) : null;
};

export const saveExchangeRateToCache = async (key: string, rate: number) => {
    if (exchangeRateCache) {
        await exchangeRateCache.setRate(key, rate);
    }
};

export const clearExpiredExchangeRates = async () => {
    if (exchangeRateCache) {
        await exchangeRateCache.clearExpiredRates();
    }
};
