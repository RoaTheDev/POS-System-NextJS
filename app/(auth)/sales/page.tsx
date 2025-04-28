'use client';
import {Customer, useSalesStore} from "@/lib/stores/saleStore";
import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {
    CheckCircle,
    CreditCard,
    Package,
    PlusCircle,
    RefreshCcw,
    Search,
    ShoppingCart,
    Trash2,
    User,
    UserPlus,
    X
} from 'lucide-react';
import {addDoc, collection, doc, getDocs, orderBy, query, Timestamp, updateDoc} from 'firebase/firestore';
import {db} from '@/lib/firebase';
import {theme} from '@/lib/colorPattern';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {toast} from 'sonner';
import {Separator} from '@/components/ui/separator';
import {ProductType} from "@/lib/types/productType";
import ProductCard from "@/components/sales/ProductCard";

type CurrencyCode = 'USD' | 'THB' | 'KHR';

const CONVERSION_RATES: Record<CurrencyCode, number> = {
    'USD': 1,      // Base currency
    'THB': 35.2,   // 1 USD = 35.2 THB
    'KHR': 4100    // 1 USD = 4100 KHR
};

export default function SalesPage() {
    const [products, setProducts] = useState<ProductType[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
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

    const {cart, addToCart, removeFromCart, updateQuantity, clearCart, getTotal} = useSalesStore();
    const router = useRouter();

    const currencySymbols: Record<CurrencyCode, string> = {
        'USD': '$',
        'THB': '฿',
        'KHR': '៛'
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const productsQuery = query(collection(db, 'products'), orderBy('productName'));
                const productsSnapshot = await getDocs(productsQuery);
                const productsList = productsSnapshot.docs.map(doc => ({
                    productId: doc.id,
                    ...doc.data()
                })) as ProductType[];
                setProducts(productsList);

                const customersQuery = query(collection(db, 'customers'), orderBy('name'));
                const customersSnapshot = await getDocs(customersQuery);
                const customersList = customersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Customer[];
                setCustomers(customersList);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load products and customers', {
                    description: 'Error'
                });
            }
        };

        fetchData();
    }, []);

    const convertCurrency = (amount: number, fromCurrency: CurrencyCode = 'USD', toCurrency: CurrencyCode = currency): number => {
        if (fromCurrency === toCurrency) return amount;

        // Convert to USD first (if not already in USD)
        const amountInUSD = fromCurrency === 'USD' ? amount : amount / CONVERSION_RATES[fromCurrency];

        // Then convert to target currency
        return amountInUSD * CONVERSION_RATES[toCurrency];
    };

    const filteredProducts = products.filter(product =>
        product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

            setCustomers(prev => [...prev, newCustomerWithId]);
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

            const saleData = {
                saleId: `SALE-${Date.now()}`,
                customerId: selectedCustomer.customerId,
                products: cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    priceSold: convertCurrency(item.price, 'USD', currency) + getCurrencySymbol()// Price in selected currency
                })),
                totalAmount: totalUSD.toString(),
                totalAmountInSelectedCurrency: getTotal().toString(),
                paymentMethod,
                currency,
                exchangeRate: CONVERSION_RATES[currency],
                saleDate: Timestamp.now()
            };

            const saleRef = await addDoc(collection(db, 'sales'), saleData);
            setSaleId(saleRef.id);

            const updatePromises = cart.map(item => {
                const productDoc = products.find(p => p.productId === item.productId);
                if (productDoc) {
                    const newStock = productDoc.stock - item.quantity;
                    return updateDoc(doc(db, 'products', productDoc.productId), {
                        stock: newStock
                    });
                }
                return Promise.resolve();
            });

            await Promise.all(updatePromises);

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
    };

    // Get currency symbol based on selected currency
    const getCurrencySymbol = (): string => {
        return currencySymbols[currency];
    };

    // Get total in specified currency
    const getTotalInCurrency = (targetCurrency: CurrencyCode = currency): number => {
        return cart.reduce((sum, item) => {
            const itemTotalInCurrency = convertCurrency(item.price * item.quantity, 'USD', targetCurrency);
            return sum + itemTotalInCurrency;
        }, 0);
    };

    // Success view after completing a sale
    if (saleComplete) {
        return (
            <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center">
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
                        onClick={() => router.push('/sales/history')}
                        style={{backgroundColor: theme.primary}}
                    >
                        <ShoppingCart size={16} className="mr-2"/> View Sales
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row h-full gap-6">
            <div className="flex-1 flex flex-col">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold mb-4" style={{color: theme.primary}}>
                        Products
                    </h1>
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

                <div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto flex-grow pb-4">
                    {filteredProducts.map((product) => (
                        <ProductCard
                            key={product.productId}
                            product={{
                                ...product,
                                // Convert price for display purposes
                                displayPrice: convertCurrency(product.price, 'USD', currency)
                            }}
                            addToCartAction={addToCart}
                            currencySymbol={getCurrencySymbol()}
                        />
                    ))}
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full flex items-center justify-center h-40 text-center">
                            <p style={{color: theme.text}}>
                                No products found. Try a different search term.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right side - Cart */}
            <div className="w-full lg:w-96 flex flex-col">
                <Card className="flex-grow">
                    <CardHeader>
                        <CardTitle style={{color: theme.primary}}>Sale Summary</CardTitle>
                    </CardHeader>

                    <CardContent className="flex flex-col h-full">
                        {/* Customer section */}
                        <div className="mb-4">
                            <label className="text-sm font-medium mb-2 block" style={{color: theme.text}}>
                                Customer
                            </label>

                            {!isAddingCustomer ? (
                                <div className="flex gap-2">
                                    <Select
                                        value={selectedCustomer?.customerId || ''}
                                        onValueChange={(value) => {
                                            const customer = customers.find(c => c.customerId === value);
                                            setSelectedCustomer(customer || null);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a customer"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map((customer) => (
                                                <SelectItem key={customer.customerId} value={customer.customerId}>
                                                    {customer.name} ({customer.phone})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

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

                        {/* Payment method and Currency */}
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

                        {/* Cart items */}
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
                                        // Convert price for display
                                        const priceInSelectedCurrency = convertCurrency(item.price, 'USD', currency);
                                        const itemTotalInSelectedCurrency = priceInSelectedCurrency * item.quantity;

                                        return (
                                            <div
                                                key={item.productId}
                                                className="flex items-center justify-between p-2 rounded-md"
                                                style={{backgroundColor: theme.light}}
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium" style={{color: theme.text}}>
                                                        {item.productName}
                                                    </p>
                                                    <div className="flex items-center">
                                                        <p className="text-sm" style={{color: theme.text}}>
                                                            {getCurrencySymbol()}{priceInSelectedCurrency.toFixed(2)} ×
                                                        </p>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            max={item.stock}
                                                            value={item.quantity}
                                                            onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                                                            className="w-16 h-6 ml-1 text-sm"
                                                        />
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

                        {/* Exchange rate info */}
                        {currency !== 'USD' && (
                            <div className="mb-4 text-sm" style={{color: theme.text}}>
                                <p>Exchange Rate: 1 USD = {CONVERSION_RATES[currency]} {currency}</p>
                            </div>
                        )}

                        {/* Total */}
                        <div className="flex justify-between items-center mb-4">
                            <p className="font-medium" style={{color: theme.text}}>Total</p>
                            <p className="text-xl font-bold" style={{color: theme.primary}}>
                                {getCurrencySymbol()}{getTotalInCurrency().toFixed(2)} {currency}
                            </p>
                        </div>

                        {/* Complete sale button */}
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
        </div>
    );
}