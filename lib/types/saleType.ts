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