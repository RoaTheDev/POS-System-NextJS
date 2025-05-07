'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    CheckCircle,
    ChevronDown,
    CreditCard,
    FileText,
    PlusCircle,
    RefreshCcw,
    User,
    UserPlus,
    X,
} from 'lucide-react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { theme } from '@/lib/colorPattern';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { useCustomers } from '@/lib/queries/saleQueries';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyCode, useExchangeRates } from '@/lib/hooks/useExchangeRate';
import { useServiceStore } from '@/lib/stores/serviceStore';
import { cn } from '@/lib/utils';

interface Service {
    serviceName: string;
    description: string;
    price: number;
}

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
    'USD': '$',
    'THB': '฿',
    'KHR': '៛'
};

export default function ServiceEntryPage() {
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [currency, setCurrency] = useState<CurrencyCode>('USD');
    const [isAddingCustomer, setIsAddingCustomer] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);
    const [serviceComplete, setServiceComplete] = useState(false);
    const [serviceId, setServiceId] = useState('');
    const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
    const [isSaleSummaryExpanded, setIsSaleSummaryExpanded] = useState(false);
    const [service, setService] = useState<Service>({
        serviceName: '',
        description: '',
        price: 0
    });

    const { rates, loading: loadingRates, convertCurrency } = useExchangeRates(currency);
    const { data: customersData, isLoading: isLoadingCustomers } = useCustomers();
    const router = useRouter();
    const { selectedCustomer, setSelectedCustomer } = useServiceStore();

    useEffect(() => {
        if (customersData && selectedCustomer) {
            const customer = customersData.find(c => c.customerId === selectedCustomer.customerId);
            if (customer) {
                setSelectedCustomer(customer);
            }
        }
    }, [customersData, selectedCustomer, setSelectedCustomer]);

    const filteredCustomers = customersData?.filter(customer => {
        if (!customerSearchQuery) return true;
        const query = customerSearchQuery.toLowerCase();
        return (
            customer.name.toLowerCase().includes(query) ||
            customer.phone.toString().includes(query)
        );
    }) || [];

    const getCurrencySymbol = (): string => {
        return CURRENCY_SYMBOLS[currency];
    };

    const handleAddCustomer = async () => {
        if (!newCustomer.name || !newCustomer.phone) {
            toast.error('Name and phone are required');
            return;
        }

        try {
            setLoading(true);
            const customerData = {
                customerId: `CUST-${Date.now()}`,
                name: newCustomer.name,
                phone: Number(newCustomer.phone),
                address: newCustomer.address,
                createdAt: Timestamp.now()
            };

            const docRef = await addDoc(collection(db, 'customers'), customerData);
            const newCustomerWithId = {
                id: docRef.id,
                ...customerData
            };

            setSelectedCustomer(newCustomerWithId);
            setIsAddingCustomer(false);
            setNewCustomer({ name: '', phone: '', address: '' });
            toast.success('Customer added successfully');
        } catch (error) {
            console.error('Error adding customer:', error);
            toast.error('Failed to add customer');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateService = () => {
        if (!service.serviceName || !service.price) {
            toast.error('Service name and price are required');
            return;
        }

        if (isNaN(service.price) || service.price <= 0) {
            toast.error('Please enter a valid price');
            return;
        }

        toast.success('Service updated');
        setIsSaleSummaryExpanded(true);
    };


    const getTotalInCurrency = (targetCurrency: CurrencyCode = currency): number => {
        return convertCurrency(service.price, 'USD', targetCurrency);
    };
    const handleCompleteServiceTransaction = async () => {
        if (!service.serviceName || !service.price) {
            toast.error('Please add a service');
            return;
        }

        if (!selectedCustomer) {
            toast.error('Please select a customer');
            return;
        }

        try {
            setLoading(true);
            const totalUSD = service.price;
            const totalInSelectedCurrency = getTotalInCurrency();
            const currentExchangeRate = currency !== 'USD' ? (1 / rates['USD'])?.toFixed(2) : 1;

            const serviceData = {
                serviceTransactionId: `SERV-${Date.now()}`,
                customerId: selectedCustomer.customerId,
                service: {
                    serviceName: service.serviceName,
                    description: service.description,
                    price: service.price,
                },
                totalAmount: totalUSD.toString(),
                totalAmountInSelectedCurrency: `${totalInSelectedCurrency.toFixed(2)}${getCurrencySymbol()}`,
                paymentMethod,
                currency,
                exchangeRate: currentExchangeRate,
                transactionDate: Timestamp.now()
            };

            await addDoc(collection(db, 'services'), serviceData);
            setServiceId(serviceData.serviceTransactionId);
            setServiceComplete(true);
            toast.success('Service transaction completed successfully');
        } catch (error) {
            console.error('Error completing service transaction:', error);
            toast.error('Failed to complete service transaction');
        } finally {
            setLoading(false);
        }
    };
    const handleNewServiceTransaction = () => {
        setService({ serviceName: '', description: '', price: 0 });
        setSelectedCustomer(null);
        setPaymentMethod('cash');
        setCurrency('USD');
        setServiceComplete(false);
        setServiceId('');
        setIsSaleSummaryExpanded(false);
    };

    if (serviceComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                <Card className="w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-300">
                    <CardContent className="flex flex-col items-center text-center p-8">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-green-100">
                            <CheckCircle size={32} style={{ color: theme.primary }} />
                        </div>
                        <h1 className="text-2xl font-bold mb-2" style={{ color: theme.primary }}>
                            Service Transaction Complete!
                        </h1>
                        <p className="mb-4 text-gray-600">Transaction ID: {serviceId}</p>
                        <p className="mb-6 text-gray-600">
                            Total Amount: {getCurrencySymbol()}{getTotalInCurrency().toFixed(2)} {currency}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full">
                            <Button
                                variant="outline"
                                onClick={handleNewServiceTransaction}
                                className="flex-1 hover:bg-gray-50 transition-colors"
                                style={{ borderColor: theme.primary, color: theme.primary }}
                            >
                                <RefreshCcw size={16} className="mr-2" /> New Transaction
                            </Button>
                            <Button
                                onClick={() => router.push('/ledger/service-ledger')}
                                className="flex-1"
                                style={{ backgroundColor: theme.primary }}
                            >
                                <FileText size={16} className="mr-2" /> View Services
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center" style={{ color: theme.primary }}>
                        <FileText className="mr-2" size={28} /> Service Entry
                    </h1>
                    <Button
                        variant="outline"
                        size="sm"
                        className="lg:hidden relative"
                        onClick={() => setIsSaleSummaryExpanded(!isSaleSummaryExpanded)}
                        style={{ borderColor: theme.primary, color: theme.primary }}
                    >
                        <FileText size={20} />
                        {service.serviceName && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                    1
                                </span>
                        )}
                    </Button>
                </div>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle style={{ color: theme.primary }}>Add Service</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pb-8">
                        <div>
                            <label className="text-sm font-medium mb-2 block" style={{ color: theme.text }}>
                                Service Name
                            </label>
                            <Input
                                placeholder="Enter service name"
                                value={service.serviceName}
                                onChange={(e) => setService((prev) => ({ ...prev, serviceName: e.target.value }))}
                                className="transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block" style={{ color: theme.text }}>
                                Description
                            </label>
                            <Textarea
                                placeholder="Enter detailed service description"
                                value={service.description}
                                onChange={(e) => setService((prev) => ({ ...prev, description: e.target.value }))}
                                className="resize-none transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                rows={6}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block" style={{ color: theme.text }}>
                                Price (USD)
                            </label>
                            <Input
                                placeholder="Enter price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={service.price || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || !isNaN(Number(val))) {
                                        setService((prev) => ({ ...prev, price: val === '' ? 0 : Number(val) }));
                                    }
                                }}
                                onKeyDown={(e) => {
                                    const allowedKeys = [
                                        'Backspace',
                                        'Tab',
                                        'ArrowLeft',
                                        'ArrowRight',
                                        'Delete',
                                        '.',
                                    ];
                                    if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                className="transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            />
                        </div>
                        <Button
                            onClick={handleUpdateService}
                            className="w-full hover:scale-[1.02] transition-transform"
                            style={{ backgroundColor: theme.primary }}
                        >
                            <PlusCircle size={16} className="mr-2" /> Update Service
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div
                className={cn(
                    'lg:w-96 lg:flex lg:flex-col lg:order-2 lg:static',
                    'fixed inset-x-0 bottom-0 z-30 transform transition-transform duration-300 ease-in-out',
                    isSaleSummaryExpanded ? 'translate-y-0' : 'translate-y-full lg:translate-y-0',
                    'lg:transform-none lg:z-auto bg-white lg:bg-transparent'
                )}
                style={{
                    maxHeight: isSaleSummaryExpanded ? '85vh' : 'auto',
                    overflowY: 'auto'
                }}
            >
                <div className="sticky top-0 z-50 w-full bg-white shadow-md lg:hidden flex justify-between items-center p-2 border-b">
                    <div className="flex items-center">
                        <FileText size={16} className="mr-2" style={{ color: theme.primary }} />
                        <span className="font-medium" style={{ color: theme.primary }}>Transaction Summary</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsSaleSummaryExpanded(false)}
                        className="flex items-center"
                    >
                        <ChevronDown size={20} />
                        <span className="ml-1 text-sm">Close</span>
                    </Button>
                </div>

                <Card className="h-full flex flex-col border-0 lg:border rounded-none lg:rounded-lg shadow-none lg:shadow-lg">
                    <CardHeader className="sticky top-0 z-10 bg-white border-b lg:border-none flex flex-row items-center justify-between pt-4 lg:pt-6">
                        <CardTitle style={{ color: theme.primary }} className="lg:block hidden">Transaction Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-y-auto pb-safe space-y-6">
                        <div>
                            <label className="text-sm font-medium mb-2 block" style={{ color: theme.text }}>
                                Customer
                            </label>
                            {!isAddingCustomer ? (
                                <div className="flex gap-4">
                                    <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={customerPopoverOpen}
                                                className="flex-1 justify-between hover:bg-gray-50 transition-colors"
                                            >
                                                {selectedCustomer ? selectedCustomer.name : "Select customer..."}
                                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-72 p-0" align="start">
                                            <Command>
                                                <CommandInput
                                                    placeholder="Search customer..."
                                                    value={customerSearchQuery}
                                                    onValueChange={setCustomerSearchQuery}
                                                />
                                                <CommandList>
                                                    <CommandEmpty>No customer found</CommandEmpty>
                                                    <CommandGroup>
                                                        {isLoadingCustomers ? (
                                                            <CommandItem disabled>Loading customers...</CommandItem>
                                                        ) : (
                                                            filteredCustomers.map((customer) => (
                                                                <CommandItem
                                                                    key={customer.customerId}
                                                                    value={customer.customerId}
                                                                    onSelect={() => {
                                                                        setSelectedCustomer(customer);
                                                                        setCustomerPopoverOpen(false);
                                                                        setCustomerSearchQuery('');
                                                                    }}
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span>{customer.name}</span>
                                                                        <span className="text-xs text-gray-500">{customer.phone}</span>
                                                                    </div>
                                                                    {selectedCustomer?.customerId === customer.customerId && (
                                                                        <CheckCircle className="ml-auto h-4 w-4" />
                                                                    )}
                                                                </CommandItem>
                                                            ))
                                                        )}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setIsAddingCustomer(true)}
                                        style={{ borderColor: theme.primary, color: theme.primary }}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <UserPlus size={18} />
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium" style={{ color: theme.primary }}>
                                            New Customer
                                        </h4>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setIsAddingCustomer(false)}
                                        >
                                            <X size={16} />
                                        </Button>
                                    </div>
                                    <Input
                                        placeholder="Name"
                                        value={newCustomer.name}
                                        onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                                        className="transition-all duration-200"
                                    />
                                    <Input
                                        placeholder="Phone"
                                        type="tel"
                                        value={newCustomer.phone}
                                        onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                                        className="transition-all duration-200"
                                    />
                                    <Input
                                        placeholder="Address (optional)"
                                        value={newCustomer.address}
                                        onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                                        className="transition-all duration-200"
                                    />
                                    <Button
                                        onClick={handleAddCustomer}
                                        disabled={loading}
                                        style={{ backgroundColor: theme.primary }}
                                        className="w-full hover:scale-[1.02] transition-transform"
                                    >
                                        <PlusCircle size={16} className="mr-2" />
                                        Add Customer
                                    </Button>
                                </div>
                            )}
                            {selectedCustomer && (
                                <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: theme.light }}>
                                    <div className="flex items-start">
                                        <User size={16} className="mr-2 mt-1" style={{ color: theme.primary }} />
                                        <div>
                                            <p className="font-medium" style={{ color: theme.text }}>
                                                {selectedCustomer.name}
                                            </p>
                                            <p className="text-sm" style={{ color: theme.text }}>
                                                {selectedCustomer.phone}
                                            </p>
                                            {selectedCustomer.address && (
                                                <p className="text-sm" style={{ color: theme.text }}>
                                                    {selectedCustomer.address}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Separator style={{ backgroundColor: theme.secondary }} />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block" style={{ color: theme.text }}>
                                    Payment Method
                                </label>
                                <Select
                                    value={paymentMethod}
                                    onValueChange={(value) => setPaymentMethod(value)}
                                >
                                    <SelectTrigger className="transition-all duration-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="card">Card</SelectItem>
                                        <SelectItem value="bank_transfer">ABA</SelectItem>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block" style={{ color: theme.text }}>
                                    Currency
                                </label>
                                <Select
                                    value={currency}
                                    onValueChange={(value: CurrencyCode) => setCurrency(value)}
                                >
                                    <SelectTrigger className="transition-all duration-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD ($)</SelectItem>
                                        <SelectItem value="THB">Thai Baht (฿)</SelectItem>
                                        <SelectItem value="KHR">Khmer Riel (៛)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Separator style={{ backgroundColor: theme.secondary }} />

                        <div>
                            <label className="text-sm font-medium mb-2 block" style={{ color: theme.text }}>
                                Service
                            </label>
                            {service.serviceName ? (
                                <Card className="overflow-hidden shadow-sm">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 pr-4">
                                                <div className="flex items-center">
                                                    <FileText size={16} className="mr-2" style={{ color: theme.primary }} />
                                                    <h3 className="font-medium" style={{ color: theme.primary }}>
                                                        {service.serviceName}
                                                    </h3>
                                                </div>
                                                {service.description && (
                                                    <div className="mt-2" style={{ maxWidth: '100%', wordBreak: 'break-word' }}>
                                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                                            {service.description}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="font-medium whitespace-nowrap" style={{ color: theme.primary }}>
                                                {getCurrencySymbol()}{getTotalInCurrency().toFixed(2)}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <FileText size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No service added</p>
                                </div>
                            )}
                        </div>

                        <Separator style={{ backgroundColor: theme.secondary }} />

                        {currency !== 'USD' && (
                            <div className="text-sm text-gray-600">
                                <p className="flex items-center">
                                    <RefreshCcw size={14} className={cn('mr-1', loadingRates && 'animate-spin')} />
                                    Exchange Rate: 1 USD = {(1 / rates['USD'])?.toFixed(2) || '...'} {currency}
                                </p>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <p className="font-medium" style={{ color: theme.text }}>Total</p>
                            <p className="text-xl font-bold" style={{ color: theme.primary }}>
                                {getCurrencySymbol()}{getTotalInCurrency().toFixed(2)} {currency}
                            </p>
                        </div>

                        <Button
                            className="w-full hover:scale-[1.02] transition-transform mb-2.5"
                            size="lg"
                            disabled={!service.serviceName || !selectedCustomer || loading}
                            onClick={handleCompleteServiceTransaction}
                            style={{ backgroundColor: theme.primary }}
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <RefreshCcw size={18} className="mr-2 animate-spin" /> Processing...
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <CreditCard size={18} className="mr-2" /> Complete Transaction
                                </div>
                            )}
                        </Button>


                    </CardContent>
                </Card>
            </div>

            <div className="fixed bottom-4 right-4 z-20 lg:hidden">
                <Button
                    size="lg"
                    className="rounded-full shadow-lg hover:scale-110 transition-transform"
                    style={{ backgroundColor: theme.primary }}
                    onClick={() => setIsSaleSummaryExpanded(true)}
                >
                    <div className="relative">
                        <FileText size={24} />
                        {service.serviceName && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                    1
                                </span>
                        )}
                    </div>
                </Button>
            </div>
        </div>
    );
}