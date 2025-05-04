import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Trash2, RefreshCw } from 'lucide-react';
import { theme } from '@/lib/colorPattern';
import { SaleHistory } from '@/lib/types/saleType';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useSaleDelete, DeletionType } from '@/lib/hooks/useSaleDelete';

interface DeleteSaleModalProps {
    open: boolean;
    onClose: () => void;
    sale: SaleHistory | null;
    onSuccess: () => Promise<void>;
}

export default function DeleteSaleModal({ open, onClose, sale, onSuccess }: DeleteSaleModalProps) {
    const [deletionType, setDeletionType] = useState<DeletionType>('wrong_order');
    const { mutate: deleteSale, isPending: isDeleting } = useSaleDelete();

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

    <RadioGroup value={deletionType} onValueChange={(value) => setDeletionType(value as DeletionType)}>
    <div className="flex items-start space-x-2 mb-4">
    <RadioGroupItem value="wrong_order" id="wrong_order" />
    <div className="grid gap-1.5">
    <Label htmlFor="wrong_order" className="font-medium">Wrong Order</Label>
    <p className="text-sm text-gray-500">
        Delete the sale and return all products back to inventory.
        Use this option if the sale was created by mistake.
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
    disabled={isDeleting}
        >
        {isDeleting ? (
                <>
                    <RefreshCcw size={16} className="mr-2 animate-spin" />
                Deleting...
                </>
) : deletionType === 'wrong_order' ? (
        <>
            <RefreshCw size={16} className="mr-2" />
        Delete & Restore Stock
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