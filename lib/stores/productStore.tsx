import { create } from 'zustand';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    orderBy,
    where,
    Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Product, ProductFormData } from '@/lib/types/product';
import {FirebaseError} from "@firebase/util";

interface AppError {
    message: string;
    code?: string;
    severity?: 'error' | 'warning';
}

const handleError = (error: unknown): AppError => {
    const defaultMessage = 'An unexpected error occurred. Please try again.';

    if (error instanceof Error) {
        switch ((error as FirebaseError).code) {
            case 'storage/permission-denied':
                return { message: 'Permission denied while accessing storage.', code: 'PERMISSION_DENIED', severity: 'error' };
            case 'firestore/permission-denied':
                return { message: 'You do not have permission to perform this action.', code: 'PERMISSION_DENIED', severity: 'error' };
            case 'storage/object-not-found':
                return { message: 'The file could not be found.', code: 'FILE_NOT_FOUND', severity: 'warning' };
            case 'firestore/not-found':
                return { message: 'The requested products was not found.', code: 'NOT_FOUND', severity: 'warning' };
            default:
                return { message: defaultMessage, code: (error as FirebaseError).code, severity: 'error' };
        }
    }

    return { message: defaultMessage, severity: 'error' };
};

interface ProductState {
    products: Product[];
    isLoading: boolean;
    error: AppError | null;
    fetchProducts: () => Promise<void>;
    addProduct: (productData: ProductFormData) => Promise<void>;
    updateProduct: (productId: string, productData: ProductFormData) => Promise<void>;
    deleteProduct: (productId: string) => Promise<void>;
    searchProducts: (searchTerm: string, category?: string) => Promise<void>;
    clearError: () => void; // New method to clear errors
}

export const useProductStore = create<ProductState>((set, get) => ({
    products: [],
    isLoading: false,
    error: null,

    clearError: () => set({ error: null }),

    fetchProducts: async () => {
        set({ isLoading: true, error: null });
        try {
            const productsRef = collection(db, 'products');
            const q = query(productsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const productsData: Product[] = querySnapshot.docs.map((doc) => ({
                ...(doc.data() as Omit<Product, 'productId'>),
                productId: doc.id,
            }));

            set({ products: productsData });
        } catch (error) {
            const appError = handleError(error);
            set({ error: appError });
        } finally {
            set({ isLoading: false });
        }
    },

    addProduct: async (productData: ProductFormData) => {
        set({ isLoading: true, error: null });
        try {
            let productImgUrl = '';

            if (productData.productImage) {
                const storageRef = ref(storage, `products/${Date.now()}_${productData.productImage.name}`);
                await uploadBytes(storageRef, productData.productImage);
                productImgUrl = await getDownloadURL(storageRef);
            }

            await addDoc(collection(db, 'products'), {
                productName: productData.productName,
                categoryName: productData.categoryName,
                price: Number(productData.price),
                stock: Number(productData.stock),
                description: productData.description,
                productImgUrl,
                createdAt: Timestamp.now(),
            });

            await get().fetchProducts();
        } catch (error) {
            const appError = handleError(error);
            set({ error: appError });
        } finally {
            set({ isLoading: false });
        }
    },

    updateProduct: async (productId: string, productData: ProductFormData) => {
        set({ isLoading: true, error: null });
        try {
            const productRef = doc(db, 'products', productId);
            const currentProduct = get().products.find((p) => p.productId === productId);

            if (!currentProduct) {
                throw new Error('Product not found');
            }

            let productImgUrl = currentProduct.productImgUrl;

            if (productData.productImage) {
                if (productImgUrl) {
                    try {
                        const oldImageRef = ref(storage, productImgUrl);
                        await deleteObject(oldImageRef);
                    } catch (error) {
                        // Log non-critical error but continue
                        console.warn('Failed to delete old image:', error);
                    }
                }

                const storageRef = ref(storage, `products/${Date.now()}_${productData.productImage.name}`);
                await uploadBytes(storageRef, productData.productImage);
                productImgUrl = await getDownloadURL(storageRef);
            }

            await updateDoc(productRef, {
                productName: productData.productName,
                categoryName: productData.categoryName,
                price: Number(productData.price),
                stock: Number(productData.stock),
                description: productData.description,
                productImgUrl,
            });

            await get().fetchProducts();
        } catch (error) {
            const appError = handleError(error);
            set({ error: appError });
        } finally {
            set({ isLoading: false });
        }
    },

    deleteProduct: async (productId: string) => {
        set({ isLoading: true, error: null });
        try {
            const productRef = doc(db, 'products', productId);
            const currentProduct = get().products.find((p) => p.productId === productId);

            if (!currentProduct) {
                throw new Error('Product not found');
            }

            if (currentProduct.productImgUrl) {
                try {
                    const imageRef = ref(storage, currentProduct.productImgUrl);
                    await deleteObject(imageRef);
                } catch (error) {
                    console.warn('Failed to delete image:', error);
                }
            }

            await deleteDoc(productRef);

            set({
                products: get().products.filter((p) => p.productId !== productId),
            });
        } catch (error) {
            const appError = handleError(error);
            set({ error: appError });
        } finally {
            set({ isLoading: false });
        }
    },

    searchProducts: async (searchTerm: string, category?: string) => {
        set({ isLoading: true, error: null });
        try {
            const productsRef = collection(db, 'products');
            const q = category && category !== 'All'
                ? query(productsRef, where('categoryName', '==', category), orderBy('createdAt', 'desc'))
                : query(productsRef, orderBy('createdAt', 'desc'));

            const querySnapshot = await getDocs(q);

            const productsData: Product[] = querySnapshot.docs.map((doc) => ({
                ...(doc.data() as Omit<Product, 'productId'>),
                productId: doc.id,
            }));

            const filteredProducts = searchTerm
                ? productsData.filter(
                    (product) =>
                        product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        product.description.toLowerCase().includes(searchTerm.toLowerCase())
                )
                : productsData;

            set({ products: filteredProducts });
        } catch (error) {
            const appError = handleError(error);
            set({ error: appError });
        } finally {
            set({ isLoading: false });
        }
    },
}));