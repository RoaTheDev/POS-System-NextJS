import {DBSchema, IDBPDatabase, openDB} from 'idb';

interface ExchangeRateDB extends DBSchema {
    'exchange-rate-cache': {
        key: string;
        value: {
            rate: number;
            timestamp: number;
        };
    };
}

const RATE_EXPIRATION = 6 * 60 * 60 * 1000; // 3 hours

class ExchangeRateCache {
    private readonly dbPromise: Promise<IDBPDatabase<ExchangeRateDB>>;
    private dbInitialized = false;

    constructor() {
        this.dbPromise = openDB<ExchangeRateDB>('exchange-rate-db', 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('exchange-rate-cache')) {
                    db.createObjectStore('exchange-rate-cache');
                }
                return db;
            },
        }).then(db => {
            this.dbInitialized = true;
            return db;
        }).catch(err => {
            console.error('Failed to initialize IndexedDB:', err);
            throw err;
        });
    }

    async getRate(key: string): Promise<number | null> {
        if (!this.dbInitialized) {
            console.warn('Database not yet initialized when attempting to getRate');
            return null;
        }

        try {
            const db = await this.dbPromise;
            const cachedRate = await db.get('exchange-rate-cache', key);

            if (!cachedRate) {
                console.log(`No cached rate found for ${key}`);
                return null;
            }

            if (Date.now() - cachedRate.timestamp > RATE_EXPIRATION) {
                console.log(`Cached rate for ${key} expired, deleting`);
                await db.delete('exchange-rate-cache', key);
                return null;
            }

            console.log(`Using cached rate for ${key}: ${cachedRate.rate}`);
            return cachedRate.rate;
        } catch (error) {
            console.error('Error getting rate from cache:', error);
            return null;
        }
    }

    async setRate(key: string, rate: number): Promise<void> {
        if (!this.dbInitialized) {
            console.warn('Database not yet initialized when attempting to setRate');
            return;
        }

        try {
            console.log(`Caching rate for ${key}: ${rate}`);
            const db = await this.dbPromise;
            await db.put('exchange-rate-cache', {rate, timestamp: Date.now()}, key);
        } catch (error) {
            console.error('Error setting rate in cache:', error);
        }
    }

    async clearExpiredRates(): Promise<void> {
        if (!this.dbInitialized) {
            console.warn('Database not yet initialized when attempting to clearExpiredRates');
            return;
        }

        try {
            const db = await this.dbPromise;
            const keys = await db.getAllKeys('exchange-rate-cache');

            const deletionPromises = keys.map(async (key) => {
                const data = await db.get('exchange-rate-cache', key);
                if (data && Date.now() - data.timestamp > RATE_EXPIRATION) {
                    console.log(`Clearing expired rate for ${key}`);
                    await db.delete('exchange-rate-cache', key);
                }
            });

            await Promise.all(deletionPromises);
        } catch (error) {
            console.error('Error clearing expired exchange rates:', error);
        }
    }
}

let exchangeRateCache: ExchangeRateCache | null = null;

if (typeof window !== 'undefined') {
    try {
        exchangeRateCache = new ExchangeRateCache();
    } catch (err) {
        console.error('Failed to create exchange rate cache:', err);
    }
}

export const getCachedExchangeRate = async (key: string): Promise<number | null> => {
    if (!exchangeRateCache) return null;
    return await exchangeRateCache.getRate(key);
};

export const saveExchangeRateToCache = async (key: string, rate: number): Promise<void> => {
    if (!exchangeRateCache) return;
    await exchangeRateCache.setRate(key, rate);
};

export const clearExpiredExchangeRates = async (): Promise<void> => {
    if (!exchangeRateCache) return;
    await exchangeRateCache.clearExpiredRates();
};