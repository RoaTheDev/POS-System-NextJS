import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getCountFromServer,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    QueryDocumentSnapshot,
    startAfter,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import {db} from '@/lib/firebase';
import {ProductFormData, ProductType} from '@/lib/types/productType';
import {FirebaseError} from '@firebase/util';
import {useMutation, useQuery} from '@tanstack/react-query';
import {useProductStore} from '@/lib/stores/productStore';

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
                    return {
                        message: 'You do not have permission to perform this action.',
                        code: 'PERMISSION_DENIED',
                        severity: 'error'
                    };
                case 'firestore/not-found':
                    return {message: 'The requested product was not found.', code: 'NOT_FOUND', severity: 'warning'};
                default:
                    return {message: defaultMessage, code: (error as FirebaseError).code, severity: 'error'};
            }
        }
        return {message: error.message, severity: 'error'};
    }

    return {message: defaultMessage, severity: 'error'};
};

const uploadToCloudinary = async (file: File): Promise<{ url: string; publicId: string }> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
        formData.append('folder', 'products');

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error('Failed to upload image to Cloudinary');
        }

        const data = await response.json();
        return {
            url: data.secure_url,
            publicId: data.public_id,
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};

const deleteFromCloudinary = async (publicId: string): Promise<void> => {
    try {
        const response = await fetch('/api/cloudinary/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({publicId}),
        });

        if (!response.ok) {
            throw new Error('Failed to delete image from Cloudinary');
        }
    } catch (error) {
        console.warn('Failed to delete image from Cloudinary:', error);
    }
};

interface PaginationCache {
    [key: string]: {
        pageDocuments: Map<number, QueryDocumentSnapshot>;
        totalCount: number;
    };
}

const paginationCache: PaginationCache = {};

interface ProductsPage {
    products: ProductType[];
    totalProducts: number;
    totalPages: number;
    lastVisible: QueryDocumentSnapshot | null;
}

export const useFetchProducts = (pageSize: number = 10, page: number = 1) => {
    const {setLoading, setError} = useProductStore();

    return useQuery<ProductsPage, Error>({
        queryKey: ['products', page, pageSize],
        queryFn: async () => {
            setLoading(true);
            try {
                const productsRef = collection(db, 'products');
                const cacheKey = 'all';

                if (!paginationCache[cacheKey]) {
                    paginationCache[cacheKey] = {
                        pageDocuments: new Map(),
                        totalCount: 0,
                    };
                }

                if (paginationCache[cacheKey].totalCount === 0) {
                    const snapshot = await getCountFromServer(productsRef);
                    paginationCache[cacheKey].totalCount = snapshot.data().count;
                }

                const totalCount = paginationCache[cacheKey].totalCount;
                const totalPages = Math.ceil(totalCount / pageSize);

                let q = query(productsRef, orderBy('createdAt', 'desc'));

                if (page > 1) {
                    const startDoc = paginationCache[cacheKey].pageDocuments.get(page - 1);

                    if (startDoc) {
                        q = query(q, startAfter(startDoc), limit(pageSize));
                    } else {
                        const prevPageDocs = await getDocs(
                            query(productsRef, orderBy('createdAt', 'desc'), limit((page - 1) * pageSize))
                        );

                        if (!prevPageDocs.empty) {
                            const lastVisible = prevPageDocs.docs[prevPageDocs.docs.length - 1];
                            q = query(q, startAfter(lastVisible), limit(pageSize));
                        } else {
                            q = query(q, limit(pageSize));
                        }
                    }
                } else {
                    q = query(q, limit(pageSize));
                }

                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    paginationCache[cacheKey].pageDocuments.set(
                        page,
                        querySnapshot.docs[querySnapshot.docs.length - 1]
                    );
                }

                const productsData: ProductType[] = querySnapshot.docs.map((doc) => ({
                    ...(doc.data() as Omit<ProductType, 'productId'>),
                    productId: doc.id,
                }));


                return {
                    products: productsData,
                    totalProducts: totalCount,
                    totalPages: totalPages,
                    lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
                };
            } catch (error) {
                console.error('Error fetching products:', error);
                const appError = handleError(error);
                setError(appError);
                throw error;
            } finally {
                setLoading(false);
            }
        },
    });
};

export const useAddProduct = () => {
    const {setLoading, setError} = useProductStore();

    return useMutation<void, Error, ProductFormData>({
        mutationFn: async (productData: ProductFormData) => {
            setLoading(true);
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

                Object.keys(paginationCache).forEach((key) => {
                    paginationCache[key].pageDocuments.clear();
                    paginationCache[key].totalCount = 0;
                });
            } catch (error) {
                const appError = handleError(error);
                setError(appError);
                throw error;
            } finally {
                setLoading(false);
            }
        },
    });
};

export const useUpdateProduct = () => {
    const {setLoading, setError} = useProductStore();

    return useMutation<void, Error, { productId: string; productData: ProductFormData }>({
        mutationFn: async ({productId, productData}) => {
            setLoading(true);
            try {
                const productRef = doc(db, 'products', productId);
                const productDoc = await getDoc(productRef);

                if (!productDoc.exists()) {
                    throw new Error('Product not found');
                }

                const currentProduct = {
                    ...productDoc.data(),
                    productId: productDoc.id
                } as ProductType;

                let productImgUrl = currentProduct.productImgUrl;
                let cloudinaryPublicId = currentProduct.cloudinaryPublicId || '';

                if (productData.productImage) {
                    if (cloudinaryPublicId) {
                        try {
                            await deleteFromCloudinary(cloudinaryPublicId);
                        } catch (error) {
                            console.warn('Failed to delete old image:', error);
                        }
                    }

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

                Object.keys(paginationCache).forEach((key) => {
                    paginationCache[key].pageDocuments.clear();
                });
            } catch (error) {
                console.error('Error updating product:', error);
                const appError = handleError(error);
                setError(appError);
                throw error;
            } finally {
                setLoading(false);
            }
        },
    });
};

export const useDeleteProduct = () => {
    const {setLoading, setError} = useProductStore();

    return useMutation<void, Error, string>({
        mutationFn: async (productId) => {
            setLoading(true);
            try {
                const productRef = doc(db, 'products', productId);
                const productDoc = await getDoc(productRef);

                if (!productDoc.exists()) {
                    throw new Error('Product not found');
                }

                const currentProduct = {
                    ...productDoc.data(),
                    productId: productDoc.id
                } as ProductType;

                if (currentProduct.cloudinaryPublicId) {
                    deleteFromCloudinary(currentProduct.cloudinaryPublicId).catch((error) => {
                        console.warn('Failed to delete image from Cloudinary:', error);
                    });
                }

                await deleteDoc(productRef);

                Object.keys(paginationCache).forEach((key) => {
                    paginationCache[key].pageDocuments.clear();
                    paginationCache[key].totalCount -= 1;
                });
            } catch (error) {
                console.error('Error deleting product:', error);
                const appError = handleError(error);
                setError(appError);
                throw error;
            } finally {
                setLoading(false);
            }
        },
    });
};

export const useSearchProducts = (searchTerm: string, category?: string, pageSize: number = 10, page: number = 1) => {
    const {setLoading, setError} = useProductStore();

    return useQuery<ProductsPage, Error>({
        queryKey: ['products', 'search', searchTerm, category || 'all', page, pageSize],
        queryFn: async () => {
            setLoading(true);
            try {
                const cacheKey = `search:${searchTerm}:${category || 'all'}`;

                if (!paginationCache[cacheKey]) {
                    paginationCache[cacheKey] = {
                        pageDocuments: new Map(),
                        totalCount: 0,
                    };
                }

                const productsRef = collection(db, 'products');

                let baseQuery = query(productsRef, orderBy('createdAt', 'desc'));
                if (category && category !== 'All') {
                    baseQuery = query(productsRef, where('categoryName', '==', category), orderBy('createdAt', 'desc'));
                }

                const querySnapshot = await getDocs(baseQuery);


                let allProducts = querySnapshot.docs.map((doc) => ({
                    ...(doc.data() as Omit<ProductType, 'productId'>),
                    productId: doc.id,
                }));

                if (searchTerm) {
                    allProducts = allProducts.filter(
                        (product) =>
                            product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (product.description &&
                                product.description.toLowerCase().includes(searchTerm.toLowerCase()))
                    );

                }

                const totalCount = allProducts.length;
                paginationCache[cacheKey].totalCount = totalCount;
                const totalPages = Math.ceil(totalCount / pageSize);
                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const paginatedProducts = allProducts.slice(startIndex, endIndex);

                return {
                    products: paginatedProducts,
                    totalProducts: totalCount,
                    totalPages: totalPages,
                    lastVisible: null,
                };
            } catch (error) {
                console.error('Error searching products:', error);
                const appError = handleError(error);
                setError(appError);
                throw error;
            } finally {
                setLoading(false);
            }
        },
        enabled: true,
    });
};