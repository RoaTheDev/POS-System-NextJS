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
import { ServiceHistory, ServiceFilter } from '@/lib/types/serviceType';

export interface ServicesDataResult {
    services: ServiceHistory[];
    totalItems: number;
    totalPages: number;
    availableCurrencies: string[];
}

export async function fetchServicesData(
    page: number,
    itemsPerPage: number,
    filters: ServiceFilter,
    customersMap: Record<string, Customer>
): Promise<ServicesDataResult> {
    try {
        // Build query constraints
        const filterConstraints: QueryConstraint[] = [];
        const orderingConstraints: QueryConstraint[] = [orderBy('transactionDate', 'desc')];

        // Add date filter if present
        if (filters.dateFilter) {
            const startOfDay = new Date(filters.dateFilter);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(filters.dateFilter);
            endOfDay.setHours(23, 59, 59, 999);
            filterConstraints.push(where('transactionDate', '>=', Timestamp.fromDate(startOfDay)));
            filterConstraints.push(where('transactionDate', '<=', Timestamp.fromDate(endOfDay)));
        }

        // Add payment method filter if present
        if (filters.paymentFilter !== 'all') {
            filterConstraints.push(where('paymentMethod', '==', filters.paymentFilter));
        }

        // Add currency filter if present
        if (filters.currencyFilter !== 'all') {
            filterConstraints.push(where('currency', '==', filters.currencyFilter));
        }

        // Fetch all services matching server-side filters
        const servicesQuery = query(
            collection(db, 'services'),
            ...filterConstraints,
            ...orderingConstraints
        );
        const servicesSnapshot = await getDocs(servicesQuery);

        // Map services data
        const currencies = new Set<string>();
        const allServices = servicesSnapshot.docs.map((doc) => {
            const data = doc.data() as ServiceHistory;
            if (data.currency) {
                currencies.add(data.currency);
            }
            return {
                id: doc.id,
                serviceTransactionId: data.serviceTransactionId,
                customerId: data.customerId,
                service: data.service,
                totalAmount: data.totalAmount,
                totalAmountInSelectedCurrency: data.totalAmountInSelectedCurrency,
                paymentMethod: data.paymentMethod,
                currency: data.currency || 'USD',
                exchangeRate: data.exchangeRate || 1,
                transactionDate: data.transactionDate,
                customerName: customersMap[data.customerId]?.name || 'Unknown'
            };
        });

        // Apply searchQuery filter client-side
        let filteredServices = allServices;
        if (filters.searchQuery) {
            const searchLower = filters.searchQuery.toLowerCase();
            filteredServices = allServices.filter(
                (service) =>
                    service.serviceTransactionId.toLowerCase().includes(searchLower) ||
                    service.customerName?.toLowerCase().includes(searchLower) ||
                    service.service.serviceName?.toLowerCase().includes(searchLower) ||
                    service.service.description?.toLowerCase().includes(searchLower)
            );
        }

        // Calculate pagination
        const totalItems = filteredServices.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // Apply pagination client-side
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedServices = filteredServices.slice(startIndex, endIndex);

        return {
            services: paginatedServices,
            totalItems,
            totalPages,
            availableCurrencies: Array.from(currencies)
        };
    } catch (error) {
        console.error('Error fetching services data:', error);
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