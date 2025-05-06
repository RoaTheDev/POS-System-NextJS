import {useMutation, useQueryClient} from '@tanstack/react-query';
import {deleteDoc, doc, runTransaction, getDoc, DocumentReference} from 'firebase/firestore';
import {db} from '@/lib/firebase';
import {SaleHistory} from '@/lib/types/saleType';
import {ProductType} from '@/lib/types/productType';
import {toast} from 'sonner';

export type DeletionType = 'wrong_order' | 'absolute';

interface DeleteSaleParams {
    sale: SaleHistory;
    deletionType: DeletionType;
}

interface ExistingProduct {
    ref: DocumentReference;
    productId: string;
    quantity: number;
    data: ProductType;
}

interface MissingProduct {
    productId: string;
    name: string;
}

export const useSaleDelete = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, DeleteSaleParams>({
        mutationFn: async ({sale, deletionType}) => {
            if (deletionType === 'wrong_order') {
                await restoreStockAndDeleteSale(sale);
            } else {
                await deleteDoc(doc(db, 'sales', sale.id));
                toast.success('Sale record deleted successfully');
            }
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ['sales']});
            await queryClient.invalidateQueries({queryKey: ['products']});
        }
    });
};

const restoreStockAndDeleteSale = async (sale: SaleHistory) => {
    try {
        const existingProducts: ExistingProduct[] = [];
        const missingProducts: MissingProduct[] = [];

        for (const saleProduct of sale.products) {
            const productRef = doc(db, 'products', saleProduct.productId);
            const productDoc = await getDoc(productRef);

            if (productDoc.exists()) {
                existingProducts.push({
                    ref: productRef,
                    productId: saleProduct.productId,
                    quantity: saleProduct.quantity,
                    data: productDoc.data() as ProductType
                });
            } else {
                missingProducts.push({
                    productId: saleProduct.productId,
                    name: saleProduct.productName || saleProduct.productId
                });
            }
        }

        if (missingProducts.length > 0) {
            const missingNames = missingProducts.map(p => p.name).join(', ');
            toast.warning(
                `Some products no longer exist and stock cannot be restored: ${missingNames}`,
                { duration: 5000 }
            );
        }

        await runTransaction(db, async (transaction) => {
            for (const product of existingProducts) {
                const currentStock = product.data.stock || 0;
                const newStock = currentStock + product.quantity;

                transaction.update(product.ref, { stock: newStock });
            }

            const saleRef = doc(db, 'sales', sale.id);
            transaction.delete(saleRef);
        });

        if (existingProducts.length > 0) {
            if (missingProducts.length > 0) {
                toast.success('Sale deleted and available stock restored partially');
            } else {
                toast.success('Sale deleted and all stock restored successfully');
            }
        } else {
            toast.success('Sale deleted, but no stock could be restored (products no longer exist)');
        }
    } catch (error) {
        console.error('Error restoring stock and deleting sale:', error);
        toast.error('Failed to delete sale and restore stock');
        throw error;
    }
};