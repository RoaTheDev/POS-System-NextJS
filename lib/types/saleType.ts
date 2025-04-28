import {Timestamp} from "firebase/firestore";


export interface SaleProduct {
    productId: string
    productName?: string
    quantity: number
    price: number
}

export interface Sale {
    id: string
    saleId: string
    customerId: string
    customerName?: string
    products: SaleProduct[]
    totalAmount: string
    paymentMethod: string
    saleDate: Timestamp
}