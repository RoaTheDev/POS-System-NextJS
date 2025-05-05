'use client';
import {useSalesStore} from "@/lib/stores/saleStore";
import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {
    CheckCircle,
    ChevronDown,
    CreditCard,
    Minus,
    Package,
    Plus,
    PlusCircle,
    RefreshCcw,
    Search,
    ShoppingCart,
    Trash2,
    User,
    UserPlus,
    X
} from 'lucide-react';
import {addDoc, collection, doc, Timestamp, updateDoc} from 'firebase/firestore';
import {db} from '@/lib/firebase';
import {theme} from '@/lib/colorPattern';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {toast} from 'sonner';
import {Separator} from '@/components/ui/separator';
import ProductCard from "@/components/sales/ProductCard";
import {useInView} from 'react-intersection-observer';
import {useCustomers, useFilteredProducts, useProducts} from '@/lib/queries/saleQueries';
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {CurrencyCode, useExchangeRates} from '@/lib/hooks/useExchangeRate';
import {useQueryClient} from "@tanstack/react-query";

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
    'USD': '$',
    'THB': '฿',
    'KHR': '៛'
};

export default function SalesPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
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
    const [saleComplete, setSaleComplete] = useState(false);
    const [saleId, setSaleId] = useState('');
    const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
    const [isSaleSummaryExpanded, setIsSaleSummaryExpanded] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    const {rates, loading: loadingRates, convertCurrency} = useExchangeRates(currency);

    const {data: customersData, isLoading: isLoadingCustomers} = useCustomers();
    const {data: filteredProductsData, isLoading: isLoadingFiltered} = useFilteredProducts(searchQuery);

    const {
        data: productsData,
        fetchNextPage,
        hasNextPage,
        isLoading: isLoadingProducts,
        isFetchingNextPage
    } = useProducts(9);

    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0.25,
        rootMargin: '100px 0px',
    });

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage && !searchQuery) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, searchQuery]);

    const {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        setSelectedCustomer,
        selectedCustomer
    } = useSalesStore();

    const router = useRouter();

    useEffect(() => {
        clearCart();
        setSelectedCustomer(null);
        setPaymentMethod('cash');
        setCurrency('USD');
        setSaleComplete(false);
        setSaleId('');
        return () => {
            clearCart();
        };
    }, [clearCart, setSelectedCustomer]);

    useEffect(() => {
        setCartCount(cart.reduce((total, item) => total + item.quantity, 0));
    }, [cart]);

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

    const displayProducts = searchQuery ?
        (filteredProductsData || []) :
        productsData?.pages.flatMap(page => page.products) || [];

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

    const getTotalInCurrency = (targetCurrency: CurrencyCode = currency): number => {
        return cart.reduce((sum, item) => {
            const itemTotalInCurrency = convertCurrency(item.price * item.quantity, 'USD', targetCurrency);
            return sum + itemTotalInCurrency;
        }, 0);
    };

    const handleCompleteSale = async () => {
        if (cart.length === 0) {
            toast.error('Cart is empty');
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
            const currentExchangeRate = currency !== 'USD' ? (1 / rates['USD']).toFixed(2) : 1;

            const saleData = {
                saleId: `SALE-${Date.now()}`,
                customerId: selectedCustomer.customerId,
                products: cart.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    price: item.price,
                })),
                totalAmount: totalUSD.toString(),
                totalAmountInSelectedCurrency: `${totalInSelectedCurrency.toFixed(2)}${getCurrencySymbol()}`,
                paymentMethod,
                currency,
                exchangeRate: currentExchangeRate,
                saleDate: Timestamp.now()
            };

            const saleRef = await addDoc(collection(db, 'sales'), saleData);
            setSaleId(saleRef.id);

            const updatePromises = cart.map(item => {
                const productDoc = displayProducts.find(p => p.productId === item.productId);
                if (productDoc) {
                    const newStock = productDoc.stock - item.quantity;
                    return updateDoc(doc(db, 'products', productDoc.productId), {
                        stock: newStock
                    });
                }
                return Promise.resolve();
            });

            await Promise.all(updatePromises);

            await queryClient.invalidateQueries({ queryKey: ['products'] });
            await queryClient.invalidateQueries({ queryKey: ['products', 'search'] });

            setSaleId(saleData.saleId);
            setSaleComplete(true);

            toast.success('Sale completed successfully');
        } catch (error) {
            console.error('Error completing sale:', error);
            toast.error('Failed to complete sale');
        } finally {
            setLoading(false);
        }
    };

    const handleNewSale = () => {
        clearCart();
        setSelectedCustomer(null);
        setPaymentMethod('cash');
        setCurrency('USD');
        setSaleComplete(false);
        setSaleId('');
        setIsSaleSummaryExpanded(false);
    };

    if (saleComplete) {
        return (
            <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center p-4">
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{backgroundColor: theme.secondary}}
                >
                    <CheckCircle size={32} style={{color: theme.primary}}/>
                </div>
                <h1 className="text-2xl font-bold mb-2" style={{color: theme.primary}}>
                    Sale Complete!
                </h1>
                <p className="mb-4" style={{color: theme.text}}>
                    Sale ID: {saleId}
                </p>
                <p className="mb-6" style={{color: theme.text}}>
                    Total Amount: {getCurrencySymbol()}{getTotalInCurrency().toFixed(2)} {currency}
                </p>
                <div className="flex space-x-4">
                    <Button
                        variant="outline"
                        onClick={handleNewSale}
                        style={{borderColor: theme.primary, color: theme.primary}}
                    >
                        <RefreshCcw size={16} className="mr-2"/> New Sale
                    </Button>
                    <Button
                        onClick={() => router.push('/ledger')}
                        style={{backgroundColor: theme.primary}}
                    >
                        <ShoppingCart size={16} className="mr-2"/> View Sales
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
                            <ShoppingCart className="inline mr-2 mb-1" size={24}/>
                            Sale Management
                        </h1>

                        <Button
                            variant="outline"
                            size="sm"
                            className="lg:hidden relative"
                            onClick={() => setIsSaleSummaryExpanded(!isSaleSummaryExpanded)}
                            style={{borderColor: theme.primary, color: theme.primary}}
                        >
                            <ShoppingCart size={20}/>
                            {cartCount > 0 && (
                                <span
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                    {cartCount}
                                </span>
                            )}
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                        <Input
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2 sm:gap-3 pb-4">
                        {isLoadingProducts || isLoadingFiltered ? (
                            <div className="col-span-full flex items-center justify-center h-40">
                                <p style={{ color: theme.text }}>Loading products...</p>
                            </div>
                        ) : displayProducts.length === 0 ? (
                            <div className="col-span-full flex items-center justify-center h-40 text-center">
                                <p style={{ color: theme.text }}>No products found. Try a different search term.</p>
                            </div>
                        ) : (
                            <>
                                {displayProducts.map((product) => (
                                    <ProductCard
                                        key={product.productId}
                                        product={{
                                            ...product,
                                            displayPrice: convertCurrency(product.price, 'USD', currency),
                                        }}
                                        addToCartAction={addToCart}
                                        currencySymbol={getCurrencySymbol()}
                                        cart={cart.find((p) => p.productId === product.productId)?.quantity || 0}
                                    />
                                ))}
                            </>
                        )}
                    </div>

                    {!searchQuery && (
                        <div
                            ref={loadMoreRef}
                            className="w-full py-4 flex justify-center"
                        >
                            {isFetchingNextPage ? (
                                <div className="flex items-center justify-center p-4">
                                    <RefreshCcw className="h-6 w-6 animate-spin mr-2" />
                                    <span>Loading more products...</span>
                                </div>
                            ) : hasNextPage ? (
                                <Button
                                    variant="outline"
                                    onClick={() => fetchNextPage()}
                                    className="mx-auto"
                                >
                                    <ChevronDown className="mr-2 h-4 w-4" />
                                    Load more products
                                </Button>
                            ) : displayProducts.length > 0 ? (
                                <p className="text-sm text-gray-500 py-2">No more products to load</p>
                            ) : null}
                        </div>
                    )}
                </div>
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
                        <CardTitle style={{color: theme.primary}}>Sale Summary</CardTitle>
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
                                        <SelectItem value="aba">ABA</SelectItem>
                                        <SelectItem value="acleda">Acleda</SelectItem>
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
                        <div className="flex-grow overflow-y-auto mb-4">
                            <label className="text-sm font-medium mb-2 block" style={{color: theme.text}}>
                                Cart Items
                            </label>
                            {cart.length === 0 ? (
                                <div className="text-center py-8" style={{color: theme.text}}>
                                    <Package size={32} className="mx-auto mb-2 opacity-50"/>
                                    <p>Your cart is empty</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {cart.map((item) => {
                                        const priceInSelectedCurrency = convertCurrency(item.price, 'USD', currency);
                                        const itemTotalInSelectedCurrency = priceInSelectedCurrency * item.quantity;
                                        return (
                                            <div
                                                key={item.productId}
                                                className="flex items-center justify-between p-2 rounded-md"
                                                style={{backgroundColor: theme.light}}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <p className="text-sm" style={{color: theme.text}}>
                                                        {getCurrencySymbol()}{priceInSelectedCurrency.toFixed(2)} ×
                                                    </p>
                                                    <div className="flex items-center">
                                                        <Button
                                                            size="icon"
                                                            className="ml-2.5 h-7 w-6 rounded-l-md border-r p-0 bg-red-400 hover:bg-red-500"
                                                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                            disabled={item.quantity <= 1 || item.stock === 0}
                                                        >
                                                            <Minus size={12}/>
                                                        </Button>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            max={item.stock}
                                                            value={item.quantity}
                                                            onChange={(e) => {
                                                                const val = Math.max(1, Math.min(Number(e.target.value || 1), item.stock));
                                                                updateQuantity(item.productId, val);
                                                            }}
                                                            className="mx-2 w-7 text-center border-0 focus-visible:ring-0 no-spinner p-0 text-sm h-7"
                                                            disabled={item.stock === 0}
                                                        />
                                                        <Button
                                                            size="icon"
                                                            className="h-7 w-6 rounded-r-md border-l p-0 bg-blue-300 hover:bg-blue-500"
                                                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                            disabled={item.quantity >= item.stock || item.stock === 0}
                                                        >
                                                            <Plus size={12}/>
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <p className="font-medium" style={{color: theme.primary}}>
                                                        {getCurrencySymbol()}{itemTotalInSelectedCurrency.toFixed(2)}
                                                    </p>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => removeFromCart(item.productId)}
                                                    >
                                                        <Trash2 size={14} className="text-red-500"/>
                                                    </Button>
                                                </div>
                                            </div>
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
                            disabled={cart.length === 0 || !selectedCustomer || loading}
                            onClick={handleCompleteSale}
                            style={{backgroundColor: theme.primary}}
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <RefreshCcw size={18} className="mr-2 animate-spin"/> Processing...
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <CreditCard size={18} className="mr-2"/> Complete Sale
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
                        <ShoppingCart size={24} />
                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {cartCount}
              </span>
                        )}
                    </div>
                </Button>
            </div>
        </div>
    );
}