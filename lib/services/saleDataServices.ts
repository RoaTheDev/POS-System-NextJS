import {
    collection,
    getDocs,
    query,
    QueryConstraint,
    orderBy,
    where,
    Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Customer } from '@/lib/stores/saleStore';
import { SaleHistory, SaleFilter } from '@/lib/types/saleType';

export interface SalesDataResult {
    sales: SaleHistory[];
    totalItems: number;
    totalPages: number;
    availableCurrencies: string[];
}

export async function fetchSalesData(
    page: number,
    itemsPerPage: number,
    filters: SaleFilter,
    customersMap: Record<string, Customer>
): Promise<SalesDataResult> {
    try {
        const filterConstraints: QueryConstraint[] = [];
        const orderingConstraints: QueryConstraint[] = [orderBy('saleDate', 'desc')];

        if (filters.dateFilter) {
            const startOfDay = new Date(filters.dateFilter);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(filters.dateFilter);
            endOfDay.setHours(23, 59, 59, 999);
            filterConstraints.push(where('saleDate', '>=', Timestamp.fromDate(startOfDay)));
            filterConstraints.push(where('saleDate', '<=', Timestamp.fromDate(endOfDay)));
        }

        if (filters.paymentFilter !== 'all') {
            filterConstraints.push(where('paymentMethod', '==', filters.paymentFilter));
        }

        if (filters.currencyFilter !== 'all') {
            filterConstraints.push(where('currency', '==', filters.currencyFilter));
        }

        const salesQuery = query(
            collection(db, 'sales'),
            ...filterConstraints,
            ...orderingConstraints
        );
        const salesSnapshot = await getDocs(salesQuery);

        const currencies = new Set<string>();
        const allSales = salesSnapshot.docs.map((doc) => {
            const data = doc.data() as SaleHistory;
            if (data.currency) {
                currencies.add(data.currency);
            }
            return {
                id: doc.id,
                saleId: data.saleId,
                customerId: data.customerId,
                products: data.products,
                totalAmount: data.totalAmount,
                totalAmountInSelectedCurrency: data.totalAmountInSelectedCurrency,
                paymentMethod: data.paymentMethod,
                currency: data.currency || 'USD',
                exchangeRate: data.exchangeRate || 1,
                saleDate: data.saleDate,
                customerName: customersMap[data.customerId]?.name || 'Unknown'
            };
        });

        let filteredSales = allSales;
        if (filters.searchQuery) {
            const searchLower = filters.searchQuery.toLowerCase();
            filteredSales = allSales.filter(
                (sale) =>
                    sale.saleId.toLowerCase().includes(searchLower) ||
                    sale.customerName?.toLowerCase().includes(searchLower) ||
                    sale.products.some((p) => p.productName?.toLowerCase().includes(searchLower))
            );
        }

        const totalItems = filteredSales.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedSales = filteredSales.slice(startIndex, endIndex);

        return {
            sales: paginatedSales,
            totalItems,
            totalPages,
            availableCurrencies: Array.from(currencies)
        };
    } catch (error) {
        console.error('Error fetching sales data:', error);
        throw error;
    }
}

export async function fetchCustomers(): Promise<Record<string, Customer>> {
    try {
        const customersQuery = query(collection(db, 'customers'));
        const customersSnapshot = await getDocs(customersQuery);
        const customersMap: Record<string, Customer> = {};

        customersSnapshot.docs.forEach((doc) => {
            const customerData = doc.data() as Omit<Customer, 'id'>;
            customersMap[customerData.customerId] = {
                id: doc.id,
                ...customerData
            };
        });

        return customersMap;
    } catch (error) {
        console.error('Error fetching customers data:', error);
        throw error;
    }
}