import React, {useState} from 'react';
import {theme} from '@/lib/colorPattern';
import {Printer, X} from 'lucide-react';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {SaleHistory} from '@/lib/types/saleType';
import {Customer} from '@/lib/stores/saleStore';
import CompactReceipt from './CompactReceipt';
import {printReceipt} from '@/lib/utils/receiptUtil';

interface ReceiptModalProps {
    open: boolean;
    onClose: () => void;
    sale: SaleHistory | null;
    customers: Record<string, Customer>;
}

const BUSINESS_INFO = {
    name: 'Mai Sophany Sound',
    address: 'Serei Sophorn ,Banteay Meanchey',
    phone: '092453358',
};

const ReceiptModal: React.FC<ReceiptModalProps> = ({open, onClose, sale, customers}) => {
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handlePrint = () => {
        setIsLoading('print');
        setTimeout(() => {
            printReceipt('receipt-content');
            setIsLoading(null);
        }, 100);
    };



    if (!sale) return null;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle style={{color: theme.primary}}>Receipt</DialogTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X size={18}/>
                    </Button>
                </DialogHeader>

                {/* Receipt Content */}
                <div className="border rounded-md overflow-hidden">
                    <CompactReceipt
                        sale={sale}
                        customers={customers}
                        businessInfo={BUSINESS_INFO}
                    />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                    <Button
                        className="flex items-center justify-center gap-2"
                        style={{backgroundColor: theme.primary}}
                        onClick={handlePrint}
                        disabled={!!isLoading}
                    >
                        {isLoading === 'print' ? (
                            <div
                                className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/>
                        ) : (
                            <Printer size={16}/>
                        )}
                        Print
                    </Button>

                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ReceiptModal;