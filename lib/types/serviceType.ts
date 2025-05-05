import {Timestamp} from "firebase/firestore";

export interface ServiceHistory {
    id: string;
    serviceTransactionId: string;
    customerId: string;
    service: {
        serviceName: string;
        description: string;
        price: number;
    };
    totalAmount: string;
    totalAmountInSelectedCurrency?: string;
    paymentMethod: string;
    currency: string;
    exchangeRate: number;
    transactionDate: Timestamp;
    customerName?: string;
}
export interface ServiceFilter {
    searchQuery: string;
    paymentFilter: string;
    currencyFilter: string;
    dateFilter: Date | null;
}

export interface ServicePagination {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
}