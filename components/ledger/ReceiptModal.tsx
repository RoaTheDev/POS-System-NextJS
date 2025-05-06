import React, { useState } from 'react';
import { theme } from '@/lib/colorPattern';
import { Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SaleHistory } from '@/lib/types/saleType';
import { ServiceHistory } from '@/lib/types/serviceType';
import { Customer } from '@/lib/stores/saleStore';
import CompactSaleReceipt from './CompactSaleReceipt';
import CompactServiceReceipt from './CompactServiceReceipt';
import { printReceipt } from '@/lib/utils/receiptUtil';

interface ReceiptModalProps {
    open: boolean;
    onClose: () => void;
    transactionData: SaleHistory | ServiceHistory | null;
    customers: Record<string, Customer>;
    transactionType: 'sale' | 'service';
}

const BUSINESS_INFO = {
    name: 'Mai Sophany Sound',
    address: 'Serei Sophorn ,Banteay Meanchey',
    phone: '092453358',
};

const ReceiptModal: React.FC<ReceiptModalProps> = ({
                                                       open, onClose, transactionData, customers, transactionType
                                                   }) => {
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handlePrint = () => {
        setIsLoading('print');
        setTimeout(() => {
            printReceipt('receipt-content');
            setIsLoading(null);
        }, 100);
    };

    if (!transactionData) return null;

    const safeCustomers: Record<string, Customer> = {
        ...customers,
        [transactionData.customerId]: customers[transactionData.customerId] || {
            id: 'deleted',
            customerId: transactionData.customerId,
            name: 'Deleted Customer',
            email: '',
            phone: '',
            address: '',
            createdAt: new Date()
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader onClick={onClose} className="flex flex-row items-center justify-between">
                    <DialogTitle style={{ color: theme.primary }}>Receipt</DialogTitle>
                </DialogHeader>

                <div className="border rounded-md overflow-hidden">
                    {transactionType === 'sale' ? (
                        <CompactSaleReceipt
                            sale={transactionData as SaleHistory}
                            customers={safeCustomers}
                            businessInfo={BUSINESS_INFO}
                        />
                    ) : (
                        <CompactServiceReceipt
                            service={transactionData as ServiceHistory}
                            customers={safeCustomers}
                            businessInfo={BUSINESS_INFO}
                        />
                    )}
                </div>

                <div className="mt-4 flex justify-center">
                    <Button
                        className="flex items-center justify-center gap-2"
                        style={{ backgroundColor: theme.primary }}
                        onClick={handlePrint}
                        disabled={!!isLoading}
                    >
                        {isLoading === 'print' ? (
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                            <Printer size={16} />
                        )}
                        Print
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ReceiptModal;