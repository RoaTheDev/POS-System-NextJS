import {Timestamp} from "firebase/firestore";


export interface SaleProduct {
    productId: string
    productName?: string
    quantity: number
    price: number
}


export interface SaleHistory {
    id: string;
    saleId: string;
    customerId: string;
    products: SaleProduct[];
    totalAmount: string;
    totalAmountInSelectedCurrency?: string;
    paymentMethod: string;
    currency: string;
    exchangeRate: number;
    saleDate: Timestamp;
    customerName?: string;
}

export interface SaleFilter {
    searchQuery?: string;
    paymentFilter: string;
    currencyFilter: string;
    dateFilter: Date | null;
}

export interface SalePagination {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
}