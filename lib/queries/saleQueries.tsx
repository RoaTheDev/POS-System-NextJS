import {collection, getDocs, query, orderBy, limit, startAfter} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { ProductType } from '@/lib/types/productType';
import { Customer } from '@/lib/stores/saleStore';

type ProductsPage = {
    products: ProductType[];
    lastVisible: string | undefined;
};

export const useProducts = (pageSize = 9) => {
    return useInfiniteQuery<ProductsPage>({
        queryKey: ['products'],
        queryFn: async ({ pageParam }) => {
            let q;

            if (pageParam) {
                q = query(
                    collection(db, 'products'),
                    orderBy('productName'),
                    startAfter(pageParam),
                    limit(pageSize)
                );
            } else {
                q = query(
                    collection(db, 'products'),
                    orderBy('productName'),
                    limit(pageSize)
                );
            }

            const snapshot = await getDocs(q);
            const lastVisible = snapshot.docs[snapshot.docs.length - 1]?.id;

            const products = snapshot.docs.map(doc => ({
                productId: doc.id,
                ...doc.data()
            })) as ProductType[];

            return { products, lastVisible };
        },
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage?.lastVisible || undefined
    });
};



export const useFilteredProducts = (searchQuery: string) => {
    return useQuery({
        queryKey: ['products', 'search', searchQuery],
        queryFn: async () => {
            const q = query(
                collection(db, 'products'),
                orderBy('productName')
            );

            const snapshot = await getDocs(q);

            const products = snapshot.docs.map(doc => ({
                productId: doc.id,
                ...doc.data()
            })) as ProductType[];

            return products.filter(product =>
                product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        },
        enabled: searchQuery.length > 0,
    });
};

export const useCustomers = () => {
    return useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const q = query(
                collection(db, 'customers'),
                orderBy('name')
            );

            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Customer[];
        }
    });
};