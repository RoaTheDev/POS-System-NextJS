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
import { ServiceFilter, ServiceHistory } from '@/lib/types/serviceType';

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
    customersMap: Record<string, Customer> = {}
): Promise<ServicesDataResult> {
    try {
        const filterConstraints: QueryConstraint[] = [];
        const orderingConstraints: QueryConstraint[] = [orderBy('transactionDate', 'desc')];

        console.log('Applied filters:', filters);

        if (filters.dateFilter) {
            const startOfDay = new Date(filters.dateFilter);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(filters.dateFilter);
            endOfDay.setHours(23, 59, 59, 999);
            filterConstraints.push(where('transactionDate', '>=', Timestamp.fromDate(startOfDay)));
            filterConstraints.push(where('transactionDate', '<=', Timestamp.fromDate(endOfDay)));
        }

        if (filters.paymentFilter !== 'all') {
            filterConstraints.push(where('paymentMethod', '==', filters.paymentFilter));
        }

        if (filters.currencyFilter !== 'all') {
            filterConstraints.push(where('currency', '==', filters.currencyFilter));
        }

        const servicesQuery = query(
            collection(db, 'services'),
            ...filterConstraints,
            ...orderingConstraints
        );
        const servicesSnapshot = await getDocs(servicesQuery);

        console.log('Raw service documents:', servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const currencies = new Set<string>();
        const allServices = servicesSnapshot.docs.map((doc) => {
            const data = doc.data() as ServiceHistory;
            if (data.currency) {
                currencies.add(data.currency);
            }
            const customerName = (data.customerId && customersMap[data.customerId]?.name) || 'Deleted Customer';
            return {
                id: doc.id,
                serviceTransactionId: data.serviceTransactionId || 'Unknown',
                customerId: data.customerId || 'Unknown',
                service: {
                    serviceName: data.service?.serviceName || 'Unknown Service',
                    description: data.service?.description || '',
                    price: data.service?.price || 0
                },
                totalAmount: data.totalAmount || '0',
                totalAmountInSelectedCurrency: data.totalAmountInSelectedCurrency || '0',
                paymentMethod: data.paymentMethod || 'Unknown',
                currency: data.currency || 'USD',
                exchangeRate: data.exchangeRate || 1,
                transactionDate: data.transactionDate || Timestamp.now(),
                customerName
            };
        });

        console.log('Mapped services:', allServices);

        let filteredServices = allServices;
        if (filters.searchQuery) {
            const searchLower = filters.searchQuery.toLowerCase();
            filteredServices = allServices.filter((service) => {
                if (service.customerName === 'Deleted Customer') {
                    return (
                        searchLower === '' ||
                        service.serviceTransactionId.toLowerCase().includes(searchLower) ||
                        service.service.serviceName.toLowerCase().includes(searchLower) ||
                        (service.service.description || '').toLowerCase().includes(searchLower) ||
                        searchLower.includes('deleted customer')
                    );
                }
                return (
                    service.serviceTransactionId.toLowerCase().includes(searchLower) ||
                    service.customerName.toLowerCase().includes(searchLower) ||
                    service.service.serviceName.toLowerCase().includes(searchLower) ||
                    (service.service.description || '').toLowerCase().includes(searchLower)
                );
            });
        }

        console.log('Filtered services:', filteredServices);

        const totalItems = filteredServices.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedServices = filteredServices.slice(startIndex, endIndex);

        console.log('Paginated services:', paginatedServices);

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