import React from 'react';
import {format} from 'date-fns';
import {theme} from '@/lib/colorPattern';
import {Timestamp} from 'firebase/firestore';
import {Customer} from '@/lib/stores/saleStore';
import {SaleProduct} from "@/lib/types/saleType";

interface ReceiptProps {
    sale: {
        saleId: string;
        customerId: string;
        customerName?: string;
        products: SaleProduct[];
        totalAmount: string;
        totalAmountInSelectedCurrency?: string;
        paymentMethod: string;
        currency: string;
        exchangeRate: number;
        saleDate: Timestamp;
    };
    customers: Record<string, Customer>;
    businessInfo: {
        name: string;
        address: string;
        phone: string;
    };
}

const CompactSaleReceipt: React.FC<ReceiptProps> = ({sale, customers, businessInfo}) => {
    const formatDate = (timestamp: Timestamp) => {
        return format(timestamp.toDate(), 'MMM dd, yyyy • h:mm a');
    };

    const formatPaymentMethod = (method: string) => {
        return method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ');
    };

    return (
        <div className="p-6 max-w-md mx-auto bg-white" id="receipt-content">
            <div className="text-center mb-4">
                <h2 className="font-bold text-lg" style={{color: theme.primary}}>{businessInfo.name}</h2>
                <p className="text-xs">{businessInfo.address}</p>
                <p className="text-xs">{businessInfo.phone}</p>
            </div>

            <div className="border-t border-b border-gray-200 py-2 mb-3">
                <div className="flex justify-between text-xs">
                    <span>Receipt #:</span>
                    <span className="font-medium">{sale.saleId}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span>Date:</span>
                    <span>{formatDate(sale.saleDate)}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span>Payment:</span>
                    <span>{formatPaymentMethod(sale.paymentMethod)}</span>
                </div>
            </div>

            <div className="mb-3">
                <h3 className="text-xs font-bold mb-1">Customer:</h3>
                <p className="text-xs">{sale?.customerName || 'Deleted Customer'}</p>
                {customers[sale.customerId]?.phone && (
                    <p className="text-xs">{customers[sale.customerId]?.phone || 'N/A'}</p>
                )}
                {customers[sale.customerId]?.address && (
                    <p className="text-xs">{customers[sale.customerId]?.address || 'No Address'}</p>
                )}
            </div>

            <div className="mb-3">
                <h3 className="text-xs font-bold mb-1">Items:</h3>

                <div className="text-xs">
                    <div className="grid grid-cols-12 font-medium border-b border-gray-200 pb-1 mb-1">
                        <div className="col-span-6">Item</div>
                        <div className="col-span-2 text-right">Price</div>
                        <div className="col-span-1 text-right">Qty</div>
                        <div className="col-span-3 text-right">Total</div>
                    </div>

                    {sale.products.map((product, index) => (
                        <div key={index} className="grid grid-cols-12 py-1 border-b border-gray-100">
                            <div className="col-span-6 truncate">{product.productName}</div>
                            <div className="col-span-2 text-right">${product.price.toFixed(2)}</div>
                            <div className="col-span-1 text-right">{product.quantity}</div>
                            <div className="col-span-3 text-right">${(product.price * product.quantity).toFixed(2)}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between font-medium text-sm mt-2">
                    <span>Total ({sale.currency === 'USD' ? 'USD' : 'USD equivalent'}):</span>
                    <span style={{color: theme.primary}}>{Number(sale.totalAmount).toFixed(2)}$</span>
                </div>

                {sale.totalAmountInSelectedCurrency && sale.currency !== 'USD' && (
                    <div className="flex justify-between text-sm">
                        <span>Total ({sale.currency}):</span>
                        <span  style={{color: theme.primary}}>{sale.totalAmountInSelectedCurrency}</span>
                    </div>
                )}

                {sale.currency !== 'USD' && (
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Exchange Rate:</span>
                        <span>1 USD = {sale.exchangeRate} {sale.currency}</span>
                    </div>
                )}
            </div>

            <div className="text-center text-xs mt-6 pt-2 border-t border-gray-200">
                <p className="mb-1" style={{color: theme.primary}}>Thank you for your business!</p>
                <p className="text-gray-500">This is a computer-generated receipt</p>
            </div>
        </div>
    );
};

export default CompactSaleReceipt;