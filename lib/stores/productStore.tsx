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
    Timestamp,
    limit,
    startAfter,
    getCountFromServer,
    QueryDocumentSnapshot,
    DocumentData,
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
    totalProducts: number;
    totalPages: number;
    fetchProducts: (page?: number, pageSize?: number) => Promise<void>;
    addProduct: (productData: ProductFormData) => Promise<void>;
    updateProduct: (id: string, productData: ProductFormData) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    searchProducts: (searchTerm: string, category?: string, page?: number, pageSize?: number) => Promise<void>;
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

// Cache for pagination data
interface PaginationCache {
    [key: string]: {
        pageDocuments: Map<number, QueryDocumentSnapshot<DocumentData>>;
        totalCount: number;
    };
}

// Initialize the cache
const paginationCache: PaginationCache = {};

export const useProductStore = create<ProductState>((set, get) => ({
    products: [],
    isLoading: false,
    error: null,
    totalProducts: 0,
    totalPages: 0,

    clearError: () => set({ error: null }),

    fetchProducts: async (page = 1, pageSize = 10) => {
        set({ isLoading: true, error: null });
        try {
            const productsRef = collection(db, 'products');
            const cacheKey = 'all';

            // Initialize cache entry if not exists
            if (!paginationCache[cacheKey]) {
                paginationCache[cacheKey] = {
                    pageDocuments: new Map(),
                    totalCount: 0
                };
            }

            // Get total count for pagination
            if (paginationCache[cacheKey].totalCount === 0) {
                const snapshot = await getCountFromServer(productsRef);
                paginationCache[cacheKey].totalCount = snapshot.data().count;
            }

            const totalCount = paginationCache[cacheKey].totalCount;
            const totalPages = Math.ceil(totalCount / pageSize);

            // Create the base query with ordering
            let q = query(productsRef, orderBy('createdAt', 'desc'));

            // Apply pagination
            if (page > 1) {
                // Get the start document for pagination
                const startDoc = paginationCache[cacheKey].pageDocuments.get(page - 1);

                if (startDoc) {
                    // We have the previous page's last document, use it to paginate
                    q = query(q, startAfter(startDoc), limit(pageSize));
                } else {
                    // We don't have the previous page cached, use limit and offset approach
                    // This is less efficient but works as a fallback
                    const prevPageDocs = await getDocs(query(
                        productsRef,
                        orderBy('createdAt', 'desc'),
                        limit((page - 1) * pageSize)
                    ));

                    if (!prevPageDocs.empty) {
                        const lastVisible = prevPageDocs.docs[prevPageDocs.docs.length - 1];
                        q = query(q, startAfter(lastVisible), limit(pageSize));
                    } else {
                        q = query(q, limit(pageSize));
                    }
                }
            } else {
                // First page, just apply the limit
                q = query(q, limit(pageSize));
            }

            // Execute the query
            const querySnapshot = await getDocs(q);

            // Store last document for next page
            if (!querySnapshot.empty) {
                paginationCache[cacheKey].pageDocuments.set(
                    page,
                    querySnapshot.docs[querySnapshot.docs.length - 1]
                );
            }

            const productsData: ProductType[] = querySnapshot.docs.map((doc) => ({
                ...(doc.data() as Omit<ProductType,'productId'>),
                productId: doc.id,
            }));

            set({
                products: productsData,
                totalProducts: totalCount,
                totalPages: totalPages
            });
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
                cloudinaryPublicId,
                createdAt: Timestamp.now(),
            });

            // Clear cache on modifications
            Object.keys(paginationCache).forEach(key => {
                paginationCache[key].pageDocuments.clear();
                paginationCache[key].totalCount = 0;
            });

            await get().fetchProducts(1); // Go back to first page after adding
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

            // Clear cache on modifications to ensure fresh data
            Object.keys(paginationCache).forEach(key => {
                paginationCache[key].pageDocuments.clear();
            });

            // Refresh current page
            const currentPage = Math.ceil(get().products.findIndex(p => p.productId === productId) / 10) + 1;
            await get().fetchProducts(currentPage);
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

            // Clear cache on modifications
            Object.keys(paginationCache).forEach(key => {
                paginationCache[key].pageDocuments.clear();
                paginationCache[key].totalCount -= 1; // Decrement count but refresh on next fetch
            });

            set({
                products: get().products.filter((p) => p.productId !== productId),
                totalProducts: Math.max(0, get().totalProducts - 1),
                totalPages: Math.ceil((get().totalProducts - 1) / 10) // Assuming default page size
            });
        } catch (error) {
            const appError = handleError(error);
            set({ error: appError });
        } finally {
            set({ isLoading: false });
        }
    },

    searchProducts: async (searchTerm: string, category?: string, page = 1, pageSize = 10) => {
        set({ isLoading: true, error: null });
        try {
            // Create a cache key based on search parameters
            const cacheKey = `search:${searchTerm}:${category || 'all'}`;

            // Initialize cache entry if not exists
            if (!paginationCache[cacheKey]) {
                paginationCache[cacheKey] = {
                    pageDocuments: new Map(),
                    totalCount: 0
                };
            }

            const productsRef = collection(db, 'products');

            // Create base query depending on category
            const baseQuery = category && category !== 'All'
                ? query(productsRef, where('categoryName', '==', category), orderBy('createdAt', 'desc'))
                : query(productsRef, orderBy('createdAt', 'desc'));

            // Get total count for this search if not already cached
            if (paginationCache[cacheKey].totalCount === 0) {
                const countSnapshot = await getDocs(baseQuery);

                // For search terms, we need to filter in memory since Firestore doesn't support text search
                let filteredDocs = countSnapshot.docs;
                if (searchTerm) {
                    filteredDocs = countSnapshot.docs.filter(doc => {
                        const data = doc.data();
                        return (
                            data.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (data.description && data.description.toLowerCase().includes(searchTerm.toLowerCase()))
                        );
                    });
                }

                paginationCache[cacheKey].totalCount = filteredDocs.length;
            }

            const totalCount = paginationCache[cacheKey].totalCount;
            const totalPages = Math.ceil(totalCount / pageSize);

            // Execute query with pagination
            const querySnapshot = await getDocs(baseQuery);

            // Filter products by search term (client-side filtering)
            let filteredProducts = querySnapshot.docs.map(doc => ({
                ...(doc.data() as Omit<ProductType, 'productId'>),
                productId: doc.id,
            }));

            if (searchTerm) {
                filteredProducts = filteredProducts.filter(
                    (product) =>
                        product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
                );
            }

            // Apply manual pagination since we've filtered in memory
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

            set({
                products: paginatedProducts,
                totalProducts: totalCount,
                totalPages: totalPages
            });
        } catch (error) {
            const appError = handleError(error);
            set({ error: appError });
        } finally {
            set({ isLoading: false });
        }
    },
}));