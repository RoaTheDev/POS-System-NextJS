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
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!sale || !open) {
            setMissingProducts([]);
            setError(null);
            return;
        }

        const checkProducts = async () => {
            setIsChecking(true);
            setError(null);
            const missing: string[] = [];

            // Validate sale.products
            if (!Array.isArray(sale.products)) {
                console.error('Invalid sale.products: not an array', sale.products);
                setError('Invalid sale data: products are not properly formatted.');
                setIsChecking(false);
                return;
            }

            console.log('Checking products for sale:', sale.saleId, sale.products);

            for (const product of sale.products) {
                // Check if product is valid and has productId
                if (!product || typeof product !== 'object' || !product.productId) {
                    console.warn('Skipping invalid product:', product);
                    missing.push(product?.productName || 'Unknown Product');
                    continue;
                }

                try {
                    const productRef = doc(db, 'products', product.productId);
                    const productDoc = await getDoc(productRef);

                    console.log(`Product ${product.productId} (${product.productName}): exists=${productDoc.exists()}`);

                    if (!productDoc.exists()) {
                        missing.push(product.productName || product.productId);
                    }
                } catch (err) {
                    console.error(`Error checking product ${product.productId} (${product.productName}):`, err);
                    // Only add to missing if the error indicates the document doesn't exist
                    if (err instanceof Error && err.message.includes('not-found')) {
                        missing.push(product.productName || product.productId);
                    } else {
                        setError(`Failed to check product ${product.productName || product.productId}.`);
                    }
                }
            }

            console.log('Missing products:', missing);
            setMissingProducts(missing);
            setIsChecking(false);
        };

        checkProducts().catch((err) => {
            console.error('Error in checkProducts:', err);
            setError('Failed to check product availability.');
            setIsChecking(false);
        });
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
                onError: (err) => {
                    console.error('Deletion error:', err);
                    setError('Failed to delete sale.');
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
                    {error && (
                        <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-start">
                                <AlertTriangle size={18} className="mr-2 text-red-500 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-red-800">Error</p>
                                    <p className="text-xs text-red-700 mt-1">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-3 rounded-md mb-4" style={{ backgroundColor: theme.light }}>
                        <p className="font-medium" style={{ color: theme.text }}>
                            Sale ID: {sale.saleId}
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
                                            ? "None of the products in this sale exist. The sale will be deleted, but no stock can be restored."
                                            : `The following products cannot have stock restored: ${missingProducts.join(', ')}. The sale will be deleted, and stock will be restored for existing products.`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <RadioGroup value={deletionType} onValueChange={(value) => setDeletionType(value as DeletionType)}>
                        <div className="flex items-start space-x-2 mb-4">
                            <RadioGroupItem value="wrong_order" id="wrong_order" />
                            <div className="grid gap-1.5">
                                <Label htmlFor="wrong_order" className="font-medium">
                                    Wrong Order
                                </Label>
                                <p className="text-sm text-gray-500">
                                    Delete the sale and attempt to return products to inventory.
                                    If products no longer exist, the sale will be deleted without restoring stock for those products.
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
                        disabled={isDeleting || !!error}
                    >
                        {isDeleting ? (
                            <>
                                <RefreshCcw size={16} className="mr-2 animate-spin" />
                                Deleting...
                            </>
                        ) : deletionType === 'wrong_order' ? (
                            <>
                                <RefreshCw size={16} className="mr-2" />
                                {missingProducts.length === sale.products.length
                                    ? 'Delete Sale'
                                    : missingProducts.length > 0
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