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
import { db } from '@/lib/firebase';
import { ProductType, ProductFormData } from '@/lib/types/productType';
import { FirebaseError } from "@firebase/util";

interface AppError {
    message: string;
    code?: string;
    severity?: 'error' | 'warning';
}

const handleError = (error: unknown): AppError => {
    const defaultMessage = 'An unexpected error occurred. Please try again.';

    if (error instanceof Error) {
        if ((error as FirebaseError).code) {
            switch ((error as FirebaseError).code) {
                case 'firestore/permission-denied':
                    return { message: 'You do not have permission to perform this action.', code: 'PERMISSION_DENIED', severity: 'error' };
                case 'firestore/not-found':
                    return { message: 'The requested product was not found.', code: 'NOT_FOUND', severity: 'warning' };
                default:
                    return { message: defaultMessage, code: (error as FirebaseError).code, severity: 'error' };
            }
        }
        return { message: error.message, severity: 'error' };
    }

    return { message: defaultMessage, severity: 'error' };
};

interface ProductState {
    products: ProductType[];
    isLoading: boolean;
    error: AppError | null;
    fetchProducts: () => Promise<void>;
    addProduct: (productData: ProductFormData) => Promise<void>;
    updateProduct: (id: string, productData: ProductFormData) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    searchProducts: (searchTerm: string, category?: string) => Promise<void>;
    clearError: () => void;
}

// Helper function to upload image to Cloudinary
const uploadToCloudinary = async (file: File): Promise<{ url: string, publicId: string }> => {
    try {
        // Create a FormData instance
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
        formData.append('folder', 'products');

        // Make the upload request to Cloudinary
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        if (!response.ok) {
            throw new Error('Failed to upload image to Cloudinary');
        }

        const data = await response.json();
        return {
            url: data.secure_url,
            publicId: data.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};

// Helper function to delete image from Cloudinary
const deleteFromCloudinary = async (publicId: string): Promise<void> => {
    try {
        const response = await fetch('/api/cloudinary/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ publicId }),
        });

        if (!response.ok) {
            throw new Error('Failed to delete image from Cloudinary');
        }
    } catch (error) {
        console.warn('Failed to delete image from Cloudinary:', error);
        // Non-critical error, we can continue
    }
};

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

            const productsData: ProductType[] = querySnapshot.docs.map((doc) => ({
                ...(doc.data() as Omit<ProductType,'productId'>),
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
            let cloudinaryPublicId = '';

            if (productData.productImage) {
                const uploadResult = await uploadToCloudinary(productData.productImage);
                productImgUrl = uploadResult.url;
                cloudinaryPublicId = uploadResult.publicId;
            }

            await addDoc(collection(db, 'products'), {
                productName: productData.productName,
                categoryName: productData.categoryName,
                price: Number(productData.price),
                stock: Number(productData.stock),
                description: productData.description,
                productImgUrl,
                cloudinaryPublicId, // Store the Cloudinary public ID for later deletion if needed
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
            let cloudinaryPublicId = currentProduct.cloudinaryPublicId || '';

            if (productData.productImage) {
                // Delete old image if it exists
                if (cloudinaryPublicId) {
                    try {
                        await deleteFromCloudinary(cloudinaryPublicId);
                    } catch (error) {
                        console.warn('Failed to delete old image:', error);
                        // Non-critical error, continue with upload
                    }
                }

                // Upload new image
                const uploadResult = await uploadToCloudinary(productData.productImage);
                productImgUrl = uploadResult.url;
                cloudinaryPublicId = uploadResult.publicId;
            }

            await updateDoc(productRef, {
                productName: productData.productName,
                categoryName: productData.categoryName,
                price: Number(productData.price),
                stock: Number(productData.stock),
                description: productData.description,
                productImgUrl,
                cloudinaryPublicId,
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

            // Delete image from Cloudinary if it exists
            if (currentProduct.cloudinaryPublicId) {
                try {
                    await deleteFromCloudinary(currentProduct.cloudinaryPublicId);
                } catch (error) {
                    console.warn('Failed to delete image from Cloudinary:', error);
                    // Non-critical error, continue with document deletion
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

            const productsData: ProductType[] = querySnapshot.docs.map((doc) => ({
                ...(doc.data() as Omit<ProductType, 'productId'>),
                productId: doc.id,
            }));

            const filteredProducts = searchTerm
                ? productsData.filter(
                    (product) =>
                        product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
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