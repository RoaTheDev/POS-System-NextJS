import React from 'react';
import {format} from 'date-fns';
import {theme} from '@/lib/colorPattern';
import {Timestamp} from 'firebase/firestore';
import {Customer} from '@/lib/stores/saleStore';

interface ServiceReceiptProps {
    service: {
        serviceTransactionId: string;
        customerId: string;
        customerName?: string;
        service: {
            serviceName: string;
            description: string;
            price: number;
        };
        totalAmount: string;
        totalAmountInSelectedCurrency?: string;
        paymentMethod: string;
        currency: string;
        exchangeRate: number;
        transactionDate: Timestamp;
    };
    customers: Record<string, Customer>;
    businessInfo: {
        name: string;
        address: string;
        phone: string;
    };
}

const CompactServiceReceipt: React.FC<ServiceReceiptProps> = ({service, customers, businessInfo}) => {
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
                    <span className="font-medium">{service.serviceTransactionId}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span>Date:</span>
                    <span>{formatDate(service.transactionDate)}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span>Payment:</span>
                    <span>{formatPaymentMethod(service.paymentMethod)}</span>
                </div>
            </div>

            <div className="mb-3">
                <h3 className="text-xs font-bold mb-1">Customer:</h3>
                <p className="text-xs">{service.customerName}</p>
                {customers[service.customerId]?.phone && (
                    <p className="text-xs">{customers[service.customerId]?.phone}</p>
                )}
                {customers[service.customerId]?.address && (
                    <p className="text-xs">{customers[service.customerId]?.address}</p>
                )}
            </div>

            <div className="mb-3">
                <h3 className="text-xs font-bold mb-1">Service:</h3>
                <div className="text-xs border-b border-gray-200 pb-2 mb-2">
                    <p className="font-medium">{service.service.serviceName}</p>
                    {service.service.description && (
                        <p className="text-gray-500 mt-1">{service.service.description}</p>
                    )}
                </div>

                <div className="flex justify-between text-xs font-medium mt-2">
                    <span>Service Price:</span>
                    <span>${service.service.price.toFixed(2)}</span>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between font-medium text-sm mt-2">
                    <span>Total ({service.currency === 'USD' ? 'USD' : 'USD equivalent'}):</span>
                    <span style={{color: theme.primary}}>{Number(service.totalAmount).toFixed(2)}$</span>
                </div>

                {service.totalAmountInSelectedCurrency && service.currency !== 'USD' && (
                    <div className="flex justify-between text-sm">
                        <span>Total ({service.currency}):</span>
                        <span style={{color: theme.primary}}>{service.totalAmountInSelectedCurrency}</span>
                    </div>
                )}

                {service.currency !== 'USD' && (
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Exchange Rate:</span>
                        <span>1 USD = {service.exchangeRate} {service.currency}</span>
                    </div>
                )}
            </div>

            <div className="text-center text-xs mt-6 pt-2 border-t border-gray-200">
                <p className="mb-1" style={{color: theme.primary}}>Thank you for choosing our service!</p>
                <p className="text-gray-500">This is a computer-generated receipt</p>
            </div>
        </div>
    );
};

export default CompactServiceReceipt;