import { getCachedExchangeRate, saveExchangeRateToCache } from './cache/exchangeCache';

const API_KEY = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY || '';
const API_BASE_URL = 'https://v6.exchangerate-api.com/v6';

type ExchangeRateResponse = {
    result: string;
    documentation: string;
    terms_of_use: string;
    time_last_update_unix: number;
    time_last_update_utc: string;
    time_next_update_unix: number;
    time_next_update_utc: string;
    base_code: string;
    conversion_rates: Record<string, number>;
};

const FALLBACK_RATES: Record<string, Record<string, number>> = {
    'USD': {
        'USD': 1,
        'THB': 34,
        'KHR': 4100
    },
    'THB': {
        'USD': 0.0294,
        'THB': 1,
        'KHR': 120.59
    },
    'KHR': {
        'USD': 0.00024,
        'THB': 0.0083,
        'KHR': 1
    }
};


export const fetchExchangeRates = async (baseCurrency: string = 'USD'): Promise<Record<string, number> | null> => {
    try {
        const toCurrencies = ['USD', 'THB', 'KHR'];
        const cachedRates: Record<string, number> = {};
        let allCached = true;

        for (const toCurrency of toCurrencies) {
            if (baseCurrency === toCurrency) {
                cachedRates[toCurrency] = 1;
                continue;
            }

            const cacheKey = `${baseCurrency}_${toCurrency}`;
            const cachedRate = await getCachedExchangeRate(cacheKey);

            if (cachedRate !== null) {
                cachedRates[toCurrency] = cachedRate;
            } else {
                allCached = false;
                break;
            }
        }

        if (allCached && Object.keys(cachedRates).length === toCurrencies.length) {
            console.log('Using cached exchange rates', cachedRates);
            return cachedRates;
        }

        if (!API_KEY) {
            console.warn('No API key provided for exchange rates, using fallback rates');
            return FALLBACK_RATES[baseCurrency] || null;
        }

        console.log(`Fetching fresh exchange rates for ${baseCurrency}`);
        const response = await fetch(`${API_BASE_URL}/${API_KEY}/latest/${baseCurrency}`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data: ExchangeRateResponse = await response.json();
        console.log(`Received rates for ${baseCurrency}:`, data.conversion_rates);

        // Store rates in cache
        for (const toCurrency of toCurrencies) {
            if (baseCurrency === toCurrency) continue;

            const rate = data.conversion_rates[toCurrency];
            if (rate) {
                const cacheKey = `${baseCurrency}_${toCurrency}`;
                await saveExchangeRateToCache(cacheKey, rate);
            }
        }

        return data.conversion_rates;
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        return FALLBACK_RATES[baseCurrency] || null;
    }
};


export const getExchangeRate = async (fromCurrency: string, toCurrency: string): Promise<number> => {
    if (fromCurrency === toCurrency) return 1;

    try {
        const cacheKey = `${fromCurrency}_${toCurrency}`;
        const cachedRate = await getCachedExchangeRate(cacheKey);

        if (cachedRate !== null) {
            console.log(`Using cached rate for ${fromCurrency} to ${toCurrency}: ${cachedRate}`);
            return cachedRate;
        }

        const rates = await fetchExchangeRates(fromCurrency);

        if (rates && rates[toCurrency]) {
            const rate = rates[toCurrency];
            console.log(`Got fresh rate for ${fromCurrency} to ${toCurrency}: ${rate}`);
            return rate;
        }

        throw new Error(`Rate not found for ${fromCurrency} to ${toCurrency}`);
    } catch (error) {
        console.error('Error getting exchange rate:', error);

        if (FALLBACK_RATES[fromCurrency]?.[toCurrency]) {
            console.warn(`Using fallback rate for ${fromCurrency} to ${toCurrency}`);
            return FALLBACK_RATES[fromCurrency][toCurrency];
        }

        console.warn(`No fallback rate for ${fromCurrency} to ${toCurrency}, using 1`);
        return 1;
    }
};