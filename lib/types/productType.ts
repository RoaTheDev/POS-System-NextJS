import {Timestamp} from 'firebase/firestore';

export interface ProductType {
    productId: string;
    productName: string;
    categoryName: string;
    price: number;
    productImgUrl: string;
    stock: number;
    description: string;
    cloudinaryPublicId?: string;
    createdAt: Timestamp;
}

export interface ProductFormData {
    productName: string;
    categoryName: string;
    price: number;
    stock: number;
    description?: string;
    productImage?: File;
}