import { useEffect, useState, useCallback, useRef } from 'react';
import { fetchExchangeRates } from '../exchangeApi';
import { clearExpiredExchangeRates } from '../cache/exchangeCache';

export type CurrencyCode = 'USD' | 'THB' | 'KHR';

interface ExchangeRates {
    [key: string]: number;
}

const SUPPORTED_CURRENCIES: CurrencyCode[] = ['USD', 'THB', 'KHR'];

const FALLBACK_RATES: Record<CurrencyCode, Record<CurrencyCode, number>> = {
    'USD': { 'USD': 1, 'THB': 34, 'KHR': 4100 },
    'THB': { 'USD': 0.0294, 'THB': 1, 'KHR': 120.59 },
    'KHR': { 'USD': 0.00024, 'THB': 0.0083, 'KHR': 1 }
};

export function useExchangeRates(baseCurrency: CurrencyCode = 'USD') {
    const isMounted = useRef(true);

    const [rates, setRates] = useState<ExchangeRates>({
        'USD': baseCurrency === 'USD' ? 1 : FALLBACK_RATES[baseCurrency]['USD'],
        'THB': baseCurrency === 'THB' ? 1 : FALLBACK_RATES[baseCurrency]['THB'],
        'KHR': baseCurrency === 'KHR' ? 1 : FALLBACK_RATES[baseCurrency]['KHR']
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const latestRates = useRef(rates);
    latestRates.current = rates;

    useEffect(() => {
        isMounted.current = true;

        clearExpiredExchangeRates();

        async function fetchRates() {
            if (!baseCurrency) return;

            if (isMounted.current) setLoading(true);
            if (isMounted.current) setError(null);

            try {
                const newRates: ExchangeRates = { [baseCurrency]: 1 };
                const fetchedRates = await fetchExchangeRates(baseCurrency);

                if (!fetchedRates) {
                    throw new Error('No rates returned from API');
                }

                SUPPORTED_CURRENCIES
                    .filter(currency => currency !== baseCurrency)
                    .forEach(currency => {
                        newRates[currency] = fetchedRates[currency] || FALLBACK_RATES[baseCurrency][currency];
                    });


                if (isMounted.current) {
                    setRates(newRates);
                }
            } catch (err) {
                console.error('Error fetching exchange rates:', err);
                if (isMounted.current) {
                    setError(err instanceof Error ? err : new Error('Unknown error fetching rates'));
                }

                const fallbackRates: ExchangeRates = { [baseCurrency]: 1 };
                SUPPORTED_CURRENCIES
                    .filter(currency => currency !== baseCurrency)
                    .forEach(currency => {
                        fallbackRates[currency] = FALLBACK_RATES[baseCurrency][currency];
                    });

                if (isMounted.current) {
                    setRates(fallbackRates);
                }
            } finally {
                if (isMounted.current) {
                    setLoading(false);
                }
            }
        }

        fetchRates();

        return () => {
            isMounted.current = false;
        };
    }, [baseCurrency]);

    const convertCurrency = useCallback(
        (
            amount: number,
            fromCurrency: CurrencyCode = baseCurrency,
            toCurrency: CurrencyCode = baseCurrency
        ): number => {
            if (fromCurrency === toCurrency) return amount;

            const currentRates = latestRates.current;

            if (fromCurrency === baseCurrency) {
                return amount * currentRates[toCurrency];
            } else if (toCurrency === baseCurrency) {
                return amount / currentRates[fromCurrency];
            }

            if (baseCurrency !== fromCurrency && baseCurrency !== toCurrency) {
                const amountInBaseCurrency = amount / currentRates[fromCurrency];
                return amountInBaseCurrency * currentRates[toCurrency];
            }

            console.warn('Using fallback exchange rates for conversion');
            return amount * FALLBACK_RATES[fromCurrency][toCurrency];
        },
        [baseCurrency]
    );

    return {
        rates,
        loading,
        error,
        convertCurrency
    };
}