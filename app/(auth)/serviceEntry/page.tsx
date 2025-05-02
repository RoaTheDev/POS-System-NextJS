'use client';
import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {
    CheckCircle,
    ChevronDown,
    CreditCard,
    FileText,
    Package,
    Plus,
    PlusCircle,
    RefreshCcw,
    Trash2,
    User,
    UserPlus,
    X,
} from 'lucide-react';
import {addDoc, collection, Timestamp} from 'firebase/firestore';
import {db} from '@/lib/firebase';
import {theme} from '@/lib/colorPattern';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {toast} from 'sonner';
import {Separator} from '@/components/ui/separator';
import {useCustomers} from '@/lib/queries/saleQueries';
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Textarea} from "@/components/ui/textarea";
import {CurrencyCode, useExchangeRates} from '@/lib/hooks/useExchangeRate';
import {useServiceStore} from '@/lib/stores/serviceStore';

interface Service {
    serviceId: string;
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
    const [serviceCount, setServiceCount] = useState(0);
    const [newService, setNewService] = useState({
        name: '',
        description: '',
        price: ''
    });
    const [services, setServices] = useState<Service[]>([]);

    const {rates, loading: loadingRates, convertCurrency} = useExchangeRates(currency);
    const {data: customersData, isLoading: isLoadingCustomers} = useCustomers();
    const router = useRouter();
    const {selectedCustomer, setSelectedCustomer} = useServiceStore();

    useEffect(() => {
        setServiceCount(services.length);
    }, [services]);

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
            setNewCustomer({name: '', phone: '', address: ''});

            toast.success('Customer added successfully');
        } catch (error) {
            console.error('Error adding customer:', error);
            toast.error('Failed to add customer');
        } finally {
            setLoading(false);
        }
    };

    const handleAddServiceEntry = () => {
        if (!newService.name || !newService.price) {
            toast.error('Service name and price are required');
            return;
        }

        if (isNaN(parseFloat(newService.price)) || parseFloat(newService.price) <= 0) {
            toast.error('Please enter a valid price');
            return;
        }

        const newServiceEntry: Service = {
            serviceId: `SERVICE-${Date.now()}`,
            serviceName: newService.name,
            description: newService.description,
            price: parseFloat(newService.price)
        };

        setServices(prev => [...prev, newServiceEntry]);

        setNewService({
            name: '',
            description: '',
            price: ''
        });

        toast.success('Service added to transaction');

        // Automatically show summary panel on mobile when adding first service
        if (services.length === 0) {
            setIsSaleSummaryExpanded(true);
        }
    };

    const handleRemoveService = (serviceId: string) => {
        setServices(prev => prev.filter(service => service.serviceId !== serviceId));
        toast.success('Service removed from transaction');
    };

    const getTotal = (): number => {
        return services.reduce((sum, service) => sum + service.price, 0);
    };

    const getTotalInCurrency = (targetCurrency: CurrencyCode = currency): number => {
        return services.reduce((sum, service) => {
            const servicePriceInCurrency = convertCurrency(service.price, 'USD', targetCurrency);
            return sum + servicePriceInCurrency;
        }, 0);
    };

    const handleCompleteServiceTransaction = async () => {
        if (services.length === 0) {
            toast.error('No services added');
            return;
        }

        if (!selectedCustomer) {
            toast.error('Please select a customer');
            return;
        }

        try {
            setLoading(true);

            const totalUSD = getTotal();
            const totalInSelectedCurrency = getTotalInCurrency();
            const currentExchangeRate = currency !== 'USD' ? rates[currency] : 1;

            const serviceData = {
                serviceTransactionId: `SERV-${Date.now()}`,
                customerId: selectedCustomer.customerId,
                services: services.map(service => ({
                    serviceName: service.serviceName,
                    description: service.description,
                    price: service.price,
                })),
                totalAmount: totalUSD.toString(),
                totalAmountInSelectedCurrency: totalInSelectedCurrency.toString() + getCurrencySymbol(),
                paymentMethod,
                currency,
                exchangeRate: currentExchangeRate,
                transactionDate: Timestamp.now()
            };

            await addDoc(collection(db, 'service-transactions'), serviceData);

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
        setServices([]);
        setSelectedCustomer(null);
        setPaymentMethod('cash');
        setCurrency('USD');
        setServiceComplete(false);
        setServiceId('');
        setIsSaleSummaryExpanded(false);
    };

    if (serviceComplete) {
        return (
            <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center p-4">
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{backgroundColor: theme.secondary}}
                >
                    <CheckCircle size={32} style={{color: theme.primary}}/>
                </div>
                <h1 className="text-2xl font-bold mb-2" style={{color: theme.primary}}>
                    Service Transaction Complete!
                </h1>
                <p className="mb-4" style={{color: theme.text}}>
                    Transaction ID: {serviceId}
                </p>
                <p className="mb-6" style={{color: theme.text}}>
                    Total Amount: {getCurrencySymbol()}{getTotalInCurrency().toFixed(2)} {currency}
                </p>
                <div className="flex space-x-4">
                    <Button
                        variant="outline"
                        onClick={handleNewServiceTransaction}
                        style={{borderColor: theme.primary, color: theme.primary}}
                    >
                        <RefreshCcw size={16} className="mr-2"/> New Transaction
                    </Button>
                    <Button
                        onClick={() => router.push('/ledger')}
                        style={{backgroundColor: theme.primary}}
                    >
                        <FileText size={16} className="mr-2"/> View Services
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row h-full gap-6 pb-20 lg:pb-0">
            <div className="flex-1 flex flex-col order-1">
                <div className="mb-4">
                    <div className="flex justify-between mb-2.5">
                        <h1 className="text-2xl font-bold" style={{color: theme.primary}}>
                            <FileText className="inline mr-2 mb-1" size={24}/>
                            Service Entry
                        </h1>

                        <Button
                            variant="outline"
                            size="sm"
                            className="lg:hidden relative"
                            onClick={() => setIsSaleSummaryExpanded(!isSaleSummaryExpanded)}
                            style={{borderColor: theme.primary, color: theme.primary}}
                        >
                            <FileText size={20}/>
                            {serviceCount > 0 && (
                                <span
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                    {serviceCount}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                <Card className="mb-6 min-h-[400px]">
                    <CardHeader>
                        <CardTitle style={{color: theme.primary}}>Add Service</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-8"> {/* Added padding-bottom to increase space */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block" style={{color: theme.text}}>
                                    Service Name
                                </label>
                                <Input
                                    placeholder="Enter service name"
                                    value={newService.name}
                                    onChange={(e) => setNewService((prev) => ({...prev, name: e.target.value}))}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block" style={{color: theme.text}}>
                                    Description
                                </label>
                                <Textarea
                                    placeholder="Enter service description"
                                    value={newService.description}
                                    onChange={(e) => setNewService((prev) => ({...prev, description: e.target.value}))}
                                    className="resize-none"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block" style={{color: theme.text}}>
                                    Price (USD)
                                </label>
                                <Input
                                    placeholder="Enter price"
                                    type="number"
                                    inputMode="numeric"
                                    min="0"
                                    value={newService.price}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (!isNaN(Number(val))) {
                                            setNewService((prev) => ({...prev, price: val}));
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        const allowedKeys = [
                                            'Backspace',
                                            'Tab',
                                            'ArrowLeft',
                                            'ArrowRight',
                                            'Delete',
                                        ];
                                        if (
                                            !/[0-9]/.test(e.key) &&
                                            !allowedKeys.includes(e.key)
                                        ) {
                                            e.preventDefault();
                                        }
                                    }}

                                />
                            </div>
                            <Button
                                onClick={handleAddServiceEntry}
                                className="w-full"
                                style={{backgroundColor: theme.primary}}
                            >
                                <Plus size={16} className="mr-2"/> Add Service
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className={`
                lg:w-96 lg:flex lg:flex-col lg:order-2 lg:static
                fixed inset-0 z-30 transform transition-transform duration-300 ease-in-out
                ${isSaleSummaryExpanded ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
                lg:transform-none lg:z-auto lg:duration-0
                bg-white lg:bg-transparent
                overflow-auto
            `}>
                <Card
                    className="h-full flex flex-col border-0 lg:border rounded-none lg:rounded-lg shadow-none lg:shadow">
                    <CardHeader
                        className="sticky top-0 z-10 bg-white border-b lg:border-none flex flex-row items-center justify-between">
                        <CardTitle style={{color: theme.primary}}>Transaction Summary</CardTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setIsSaleSummaryExpanded(false)}
                        >
                            <X size={20}/>
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-y-auto pb-safe">
                        <div className="mb-4">
                            <label className="text-sm font-medium mb-2 block" style={{color: theme.text}}>
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
                                                className="flex-1 justify-between"
                                            >
                                                {selectedCustomer ? selectedCustomer.name : "Select customer..."}
                                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
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
                                                                        <span
                                                                            className="text-xs text-gray-500">{customer.phone}</span>
                                                                    </div>
                                                                    {selectedCustomer?.customerId === customer.customerId && (
                                                                        <CheckCircle className="ml-auto h-4 w-4"/>
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
                                        style={{borderColor: theme.primary, color: theme.primary}}
                                    >
                                        <UserPlus size={18}/>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium" style={{color: theme.primary}}>
                                            New Customer
                                        </h4>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setIsAddingCustomer(false)}
                                        >
                                            <X size={16}/>
                                        </Button>
                                    </div>
                                    <Input
                                        placeholder="Name"
                                        value={newCustomer.name}
                                        onChange={(e) => setNewCustomer(prev => ({...prev, name: e.target.value}))}
                                    />
                                    <Input
                                        placeholder="Phone"
                                        type="tel"
                                        value={newCustomer.phone}
                                        onChange={(e) => setNewCustomer(prev => ({...prev, phone: e.target.value}))}
                                    />
                                    <Input
                                        placeholder="Address (optional)"
                                        value={newCustomer.address}
                                        onChange={(e) => setNewCustomer(prev => ({...prev, address: e.target.value}))}
                                    />
                                    <Button
                                        onClick={handleAddCustomer}
                                        disabled={loading}
                                        style={{backgroundColor: theme.primary}}
                                        className="w-full"
                                    >
                                        <PlusCircle size={16} className="mr-2"/>
                                        Add Customer
                                    </Button>
                                </div>
                            )}
                            {selectedCustomer && (
                                <div className="mt-2 p-2 rounded-md" style={{backgroundColor: theme.light}}>
                                    <div className="flex items-start">
                                        <User size={16} className="mr-2 mt-1" style={{color: theme.primary}}/>
                                        <div>
                                            <p className="font-medium" style={{color: theme.text}}>
                                                {selectedCustomer.name}
                                            </p>
                                            <p className="text-sm" style={{color: theme.text}}>
                                                {selectedCustomer.phone}
                                            </p>
                                            {selectedCustomer.address && (
                                                <p className="text-sm" style={{color: theme.text}}>
                                                    {selectedCustomer.address}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <Separator className="my-4" style={{backgroundColor: theme.secondary}}/>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block" style={{color: theme.text}}>
                                    Payment Method
                                </label>
                                <Select
                                    value={paymentMethod}
                                    onValueChange={(value) => setPaymentMethod(value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue/>
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
                                <label className="text-sm font-medium mb-2 block" style={{color: theme.text}}>
                                    Currency
                                </label>
                                <Select
                                    value={currency}
                                    onValueChange={(value: CurrencyCode) => setCurrency(value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD ($)</SelectItem>
                                        <SelectItem value="THB">Thai Baht (฿)</SelectItem>
                                        <SelectItem value="KHR">Khmer Riel (៛)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Separator className="my-4" style={{backgroundColor: theme.secondary}}/>
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium" style={{color: theme.text}}>
                                    Services
                                </label>
                                <span className="text-sm font-medium" style={{color: theme.text}}>
                                    {services.length} {services.length === 1 ? 'item' : 'items'}
                                </span>
                            </div>

                            {services.length === 0 ? (
                                <div className="text-center py-8" style={{color: theme.text}}>
                                    <Package size={32} className="mx-auto mb-2 opacity-50"/>
                                    <p>No services added</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {services.map((service) => {
                                        const priceInSelectedCurrency = convertCurrency(service.price, 'USD', currency);
                                        return (
                                            <Card key={service.serviceId} className="overflow-hidden">
                                                <CardContent className="p-3">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="flex items-center">
                                                                <FileText size={16} className="mr-2"
                                                                          style={{color: theme.primary}}/>
                                                                <h3 className="font-medium"
                                                                    style={{color: theme.primary}}>
                                                                    {service.serviceName}
                                                                </h3>
                                                            </div>
                                                            {service.description && (
                                                                <p className="mt-1 text-xs" style={{color: theme.text}}>
                                                                    {service.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <div className="font-medium" style={{color: theme.primary}}>
                                                                {getCurrencySymbol()}{priceInSelectedCurrency.toFixed(2)}
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRemoveService(service.serviceId)}
                                                                className="mt-1 p-0 h-6 text-red-500 hover:text-red-600 hover:bg-transparent"
                                                            >
                                                                <Trash2 size={14}/>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <Separator className="my-4" style={{backgroundColor: theme.secondary}}/>
                        {currency !== 'USD' && (
                            <div className="mb-4 text-sm" style={{color: theme.text}}>
                                <p className="flex items-center">
                                    <RefreshCcw size={14} className={`mr-1 ${loadingRates ? 'animate-spin' : ''}`}/>
                                    Exchange Rate: 1 USD = {(1 / rates['USD'])?.toFixed(2) || '...'} {currency}
                                </p>
                            </div>
                        )}
                        <div className="flex justify-between items-center mb-4">
                            <p className="font-medium" style={{color: theme.text}}>Total</p>
                            <p className="text-xl font-bold" style={{color: theme.primary}}>
                                {getCurrencySymbol()}{getTotalInCurrency().toFixed(2)} {currency}
                            </p>
                        </div>
                        <Button
                            className="w-full"
                            size="lg"
                            disabled={services.length === 0 || !selectedCustomer || loading}
                            onClick={handleCompleteServiceTransaction}
                            style={{backgroundColor: theme.primary}}
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <RefreshCcw size={18} className="mr-2 animate-spin"/> Processing...
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <CreditCard size={18} className="mr-2"/> Complete Transaction
                                </div>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="fixed bottom-4 right-4 z-20 lg:hidden">
                <Button
                    size="lg"
                    className="rounded-full shadow-lg"
                    style={{backgroundColor: theme.primary}}
                    onClick={() => setIsSaleSummaryExpanded(true)}
                >
                    <div className="relative">
                        <FileText size={24}/>
                        {serviceCount > 0 && (
                            <span
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                {serviceCount}
                            </span>
                        )}
                    </div>
                </Button>
            </div>
        </div>
    );
}