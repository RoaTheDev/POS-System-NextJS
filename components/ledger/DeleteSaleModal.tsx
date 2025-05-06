import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { theme } from '@/lib/colorPattern';
import { SaleHistory } from '@/lib/types/saleType';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useSaleDelete, DeletionType } from '@/lib/hooks/useSaleDelete';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DeleteSaleModalProps {
    open: boolean;
    onClose: () => void;
    sale: SaleHistory | null;
    onSuccess: () => Promise<void>;
}

export default function DeleteSaleModal({ open, onClose, sale, onSuccess }: DeleteSaleModalProps) {
    const [deletionType, setDeletionType] = useState<DeletionType>('wrong_order');
    const { mutate: deleteSale, isPending: isDeleting } = useSaleDelete();
    const [missingProducts, setMissingProducts] = useState<string[]>([]);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        if (!sale || !open) {
            setMissingProducts([]);
            return;
        }

        const checkProducts = async () => {
            setIsChecking(true);
            const missing: string[] = [];

            for (const product of sale.products) {
                const productRef = doc(db, 'products', product.productId);
                const productDoc = await getDoc(productRef);

                if (!productDoc.exists()) {
                    missing.push(product.productName || product.productId);
                }
            }

            setMissingProducts(missing);
            setIsChecking(false);
        };

        checkProducts();
    }, [sale, open]);

    const handleDelete = () => {
        if (!sale) return;

        deleteSale(
            { sale, deletionType },
            {
                onSuccess: async () => {
                    onClose();
                    await onSuccess();
                },
            }
        );
    };

    if (!sale) return null;

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle style={{ color: theme.primary }}>Confirm Deletion</DialogTitle>
                    <DialogDescription>
                        Please select how you want to delete this sale.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="p-3 rounded-md mb-4" style={{ backgroundColor: theme.light }}>
                        <p className="font-medium" style={{ color: theme.text }}>
                            {sale.saleId}
                        </p>
                        <p className="text-sm" style={{ color: theme.text }}>
                            Customer: {sale.customerName}
                        </p>
                        <p className="text-sm" style={{ color: theme.text }}>
                            Items: {sale.products.length} {sale.products.length === 1 ? 'item' : 'items'}
                        </p>
                        <p className="text-sm" style={{ color: theme.text }}>
                            Total: ${Number(sale.totalAmount).toFixed(2)}
                        </p>
                    </div>

                    {isChecking ? (
                        <div className="flex items-center justify-center py-2">
                            <RefreshCcw size={16} className="mr-2 animate-spin" />
                            <span className="text-sm text-gray-500">Checking product availability...</span>
                        </div>
                    ) : missingProducts.length > 0 && (
                        <div className="p-3 mb-4 bg-amber-50 border border-amber-200 rounded-md">
                            <div className="flex items-start">
                                <AlertTriangle size={18} className="mr-2 text-amber-500 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-800">Some products no longer exist</p>
                                    <p className="text-xs text-amber-700 mt-1">
                                        {missingProducts.length === sale.products.length
                                            ? "None of the products in this sale exist anymore. Stock cannot be restored."
                                            : `The following products can't be restored to inventory: ${missingProducts.join(', ')}`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <RadioGroup value={deletionType} onValueChange={(value) => setDeletionType(value as DeletionType)}>
                        <div className="flex items-start space-x-2 mb-4">
                            <RadioGroupItem
                                value="wrong_order"
                                id="wrong_order"
                                disabled={missingProducts.length === sale.products.length}
                            />
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="wrong_order"
                                    className={`font-medium ${missingProducts.length === sale.products.length ? 'text-gray-400' : ''}`}
                                >
                                    Wrong Order
                                </Label>
                                <p className="text-sm text-gray-500">
                                    Delete the sale and return all products back to inventory.
                                    Use this option if the sale was created by mistake.
                                    {missingProducts.length === sale.products.length && (
                                        <span className="text-amber-600 block mt-1">
                                            (Unavailable - products no longer exist)
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-2">
                            <RadioGroupItem value="absolute" id="absolute" />
                            <div className="grid gap-1.5">
                                <Label htmlFor="absolute" className="font-medium">Archive Only</Label>
                                <p className="text-sm text-gray-500">
                                    Delete the sale record without affecting inventory.
                                    Use this for historical data cleanup.
                                </p>
                            </div>
                        </div>
                    </RadioGroup>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting || (deletionType === 'wrong_order' && missingProducts.length === sale.products.length)}
                    >
                        {isDeleting ? (
                            <>
                                <RefreshCcw size={16} className="mr-2 animate-spin" />
                                Deleting...
                            </>
                        ) : deletionType === 'wrong_order' ? (
                            <>
                                <RefreshCw size={16} className="mr-2" />
                                {missingProducts.length > 0 && missingProducts.length < sale.products.length
                                    ? 'Delete & Partially Restore Stock'
                                    : 'Delete & Restore Stock'}
                            </>
                        ) : (
                            <>
                                <Trash2 size={16} className="mr-2" />
                                Delete Record
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}