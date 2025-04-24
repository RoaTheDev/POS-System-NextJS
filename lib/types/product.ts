import { Timestamp } from 'firebase/firestore';

export interface Product {
    productId: string;
    productName: string;
    categoryName: string;
    price: number;
    productImgUrl: string;
    stock: number;
    description: string;
    createdAt: Timestamp;
}

export interface ProductFormData {
    productName: string;
    categoryName: string;
    price: number;
    stock: number;
    description?: string;
    productImage?: File ;
}