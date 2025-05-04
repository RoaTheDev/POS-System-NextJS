import {useMutation, useQueryClient} from '@tanstack/react-query';
import {deleteDoc, doc, runTransaction} from 'firebase/firestore';
import {db} from '@/lib/firebase';
import {SaleHistory} from '@/lib/types/saleType';
import {ProductType} from '@/lib/types/productType';
import {toast} from 'sonner';

export type DeletionType = 'wrong_order' | 'absolute';

interface DeleteSaleParams {
    sale: SaleHistory;
    deletionType: DeletionType;
}

export const useSaleDelete = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, DeleteSaleParams>({
        mutationFn: async ({sale, deletionType}) => {
            if (deletionType === 'wrong_order') {
                await restoreStockAndDeleteSale(sale);
            } else {
                await deleteDoc(doc(db, 'sales', sale.id));
            }
        }, onSuccess: async () => await queryClient.invalidateQueries({queryKey: ['products']})

    });
};

const restoreStockAndDeleteSale = async (sale: SaleHistory) => {
    try {
        await runTransaction(db, async (transaction) => {
            for (const saleProduct of sale.products) {
                const productRef = doc(db, 'products', saleProduct.productId);
                const productDoc = await transaction.get(productRef);

                if (!productDoc.exists()) {
                    console.warn(`Product ${saleProduct.productId} not found. Skipping stock restoration.`);
                    continue;
                }

                const productData = productDoc.data() as ProductType;
                const currentStock = productData.stock || 0;
                const newStock = currentStock + saleProduct.quantity;

                transaction.update(productRef, {stock: newStock});
            }

            const saleRef = doc(db, 'sales', sale.id);
            transaction.delete(saleRef);
        });

        toast.success('Sale deleted and stock restored successfully');
    } catch (error) {
        console.error('Error restoring stock and deleting sale:', error);
        toast.error('Failed to delete sale and restore stock');
        throw error;
    }
};