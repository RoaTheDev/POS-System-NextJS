'use client'

import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, CalendarIcon, Eye, FileText, Search} from 'lucide-react'
import {collection, getDocs, limit, orderBy, query, startAfter, Timestamp, where} from 'firebase/firestore'
import {db} from '@/lib/firebase'
import {theme} from '@/lib/colorPattern'
import {Card, CardContent} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {Calendar as CalendarComponent} from '@/components/ui/calendar'
import {format} from 'date-fns'
import {Customer} from "@/lib/stores/saleStore";
import Pagination from '@/components/common/Pagination';
import {Skeleton} from "@/components/ui/skeleton";
import {SaleHistory} from "@/lib/types/saleType";
import ReceiptModal from "@/components/sales/ReceiptModal";


export default function SalesHistoryPage() {

    const [sales, setSales] = useState<SaleHistory[]>([])
    const [customers, setCustomers] = useState<Record<string, Customer>>({})
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedSale, setSelectedSale] = useState<SaleHistory | null>(null)
    const [paymentFilter, setPaymentFilter] = useState<string>('all')
    const [currencyFilter, setCurrencyFilter] = useState<string>('all')
    const [dateFilter, setDateFilter] = useState<Date | null>(null)
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [totalItems, setTotalItems] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([])

    const router = useRouter()

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const customersQuery = query(collection(db, 'customers'))
                const customersSnapshot = await getDocs(customersQuery)
                const customersMap: Record<string, Customer> = {}

                customersSnapshot.docs.forEach(doc => {
                    const customerData = doc.data() as Omit<Customer, 'id'>
                    customersMap[customerData.customerId] = {
                        id: doc.id,
                        ...customerData
                    }
                })
                setCustomers(customersMap)
            } catch (error) {
                console.error('Error fetching customers data:', error)
            }
        }

        fetchCustomers()
    }, [])

    useEffect(() => {
        const fetchSales = async () => {
            try {
                setLoading(true)

                const salesQuery = query(
                    collection(db, 'sales'),
                    orderBy('saleDate', 'desc'),
                    limit(itemsPerPage)
                )


                const countQuery = query(collection(db, 'sales'))
                const countSnapshot = await getDocs(countQuery)
                const total = countSnapshot.size
                setTotalItems(total)
                setTotalPages(Math.ceil(total / itemsPerPage))

                const salesSnapshot = await getDocs(salesQuery)

                const currencies = new Set<string>()

                const salesData = salesSnapshot.docs.map(doc => {
                    const data = doc.data() as SaleHistory;

                    if (data.currency) {
                        currencies.add(data.currency)
                    }

                    return {
                        id: doc.id,
                        saleId: data.saleId,
                        customerId: data.customerId,
                        products: data.products,
                        totalAmount: data.totalAmount,
                        totalAmountInSelectedCurrency: data.totalAmountInSelectedCurrency,
                        paymentMethod: data.paymentMethod,
                        currency: data.currency || 'USD',
                        exchangeRate: data.exchangeRate || 1,
                        saleDate: data.saleDate,
                        customerName: customers[data.customerId]?.name || 'Unknown'
                    };
                });

                setAvailableCurrencies(Array.from(currencies))
                setSales(salesData)
            } catch (error) {
                console.error('Error fetching sales data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchSales()
    }, [customers, dateFilter, itemsPerPage, currentPage])

    const handlePageChange = async (page: number) => {
        try {
            setLoading(true)
            setCurrentPage(page)

            const skipItems = (page - 1) * itemsPerPage

            let salesQuery;

            if (page === 1) {
                salesQuery = query(
                    collection(db, 'sales'),
                    orderBy('saleDate', 'desc'),
                    limit(itemsPerPage)
                )
            } else {
                const previousPageQuery = query(
                    collection(db, 'sales'),
                    orderBy('saleDate', 'desc'),
                    limit(skipItems)
                )
                const previousPageSnapshot = await getDocs(previousPageQuery)
                const lastVisible = previousPageSnapshot.docs[previousPageSnapshot.docs.length - 1]

                salesQuery = query(
                    collection(db, 'sales'),
                    orderBy('saleDate', 'desc'),
                    startAfter(lastVisible),
                    limit(itemsPerPage)
                )
            }

            if (dateFilter) {
                const startOfDay = new Date(dateFilter)
                startOfDay.setHours(0, 0, 0, 0)

                const endOfDay = new Date(dateFilter)
                endOfDay.setHours(23, 59, 59, 999)

                salesQuery = query(
                    collection(db, 'sales'),
                    where('saleDate', '>=', Timestamp.fromDate(startOfDay)),
                    where('saleDate', '<=', Timestamp.fromDate(endOfDay)),
                    orderBy('saleDate', 'desc'),
                    limit(itemsPerPage)
                )
            }

            const salesSnapshot = await getDocs(salesQuery)

            const salesData = salesSnapshot.docs.map(doc => {
                const data = doc.data() as SaleHistory;

                return {
                    id: doc.id,
                    saleId: data.saleId,
                    customerId: data.customerId,
                    products: data.products,
                    totalAmount: data.totalAmount,
                    totalAmountInSelectedCurrency: data.totalAmountInSelectedCurrency,
                    paymentMethod: data.paymentMethod,
                    currency: data.currency || 'USD',
                    exchangeRate: data.exchangeRate || 1,
                    saleDate: data.saleDate,
                    customerName: customers[data.customerId]?.name || 'Unknown'
                };
            });

            setSales(salesData)
        } catch (error) {
            console.error('Error changing page:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleItemsPerPageChange = (value: string) => {
        const newItemsPerPage = parseInt(value)
        setItemsPerPage(newItemsPerPage)
        setCurrentPage(1)
        setTotalPages(Math.ceil(totalItems / newItemsPerPage))
    }

    const filteredSales = sales.filter(sale => {
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch = sale.saleId.toLowerCase().includes(searchLower) ||
            sale.customerName?.toLowerCase().includes(searchLower) ||
            sale.products.some(p => p.productName?.toLowerCase().includes(searchLower))

        const matchesPayment = paymentFilter === 'all' || sale.paymentMethod === paymentFilter

        const matchesCurrency = currencyFilter === 'all' || sale.currency === currencyFilter

        const matchesDate = !dateFilter ||
            (dateFilter && format(sale.saleDate.toDate(), 'yyyy-MM-dd') === format(dateFilter, 'yyyy-MM-dd'))

        return matchesSearch && matchesPayment && matchesCurrency && matchesDate
    })

    const formatDate = (timestamp: Timestamp) => {
        return format(timestamp.toDate(), 'MMM dd, yyyy • h:mm a')
    }

    const formatPaymentMethod = (method: string) => {
        return method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ')
    }

    const handleViewSale = (sale: SaleHistory) => {
        setSelectedSale(sale);
        setIsReceiptModalOpen(true);
    };
    const handleCloseReceiptModal = () => {
        setIsReceiptModalOpen(false);
        setSelectedSale(null);
    };

    const getPaymentBadgeStyle = (method: string) => {
        switch (method) {
            case 'cash':
                return {backgroundColor: '#4CAF50', color: 'white'}
            case 'card':
                return {backgroundColor: '#2196F3', color: 'white'}
            case 'bank_transfer':
                return {backgroundColor: '#9C27B0', color: 'white'}
            default:
                return {backgroundColor: theme.secondary, color: theme.text}
        }
    }

    const getCurrencyBadgeStyle = (currency: string) => {
        switch (currency) {
            case 'USD':
                return {backgroundColor: '#4CAF50', color: 'white'}
            case 'EUR':
                return {backgroundColor: '#2196F3', color: 'white'}
            case 'GBP':
                return {backgroundColor: '#FF9800', color: 'white'}
            case 'JPY':
                return {backgroundColor: '#9C27B0', color: 'white'}
            default:
                return {backgroundColor: '#607D8B', color: 'white'}
        }
    }

    const handleDateSelect = (day: Date | undefined) => {
        setDateFilter(day || null)
        setCurrentPage(1)
    }

    const renderSkeletons = () => {
        return Array.from({length: itemsPerPage}).map((_, index) => (
            <TableRow key={`skeleton-${index}`}>
                <TableCell><Skeleton className="h-5 w-20"/></TableCell>
                <TableCell><Skeleton className="h-5 w-32"/></TableCell>
                <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                <TableCell><Skeleton className="h-5 w-16"/></TableCell>
                <TableCell><Skeleton className="h-5 w-20"/></TableCell>
                <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                <TableCell><Skeleton className="h-5 w-16"/></TableCell>
                <TableCell><Skeleton className="h-8 w-8 rounded-full"/></TableCell>
            </TableRow>
        ))
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                <div className="flex items-center mb-4 md:mb-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/sales')}
                        className="mr-2"
                        style={{color: theme.primary}}
                    >
                        <ArrowLeft size={20}/>
                    </Button>
                    <h1 className="text-2xl font-bold" style={{color: theme.primary}}>
                        Sales History
                    </h1>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <div className="relative flex-grow md:flex-grow-0">
                        <Search className="absolute left-3 top-3 text-gray-400" size={16}/>
                        <Input
                            placeholder="Search sales..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 w-full md:w-64"
                        />
                    </div>

                    <Select
                        value={paymentFilter}
                        onValueChange={setPaymentFilter}
                    >
                        <SelectTrigger className="h-10 w-full md:w-40">
                            <SelectValue placeholder="Payment"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Payments</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={currencyFilter}
                        onValueChange={setCurrencyFilter}
                    >
                        <SelectTrigger className="h-10 w-full md:w-40">
                            <SelectValue placeholder="Currency"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Currencies</SelectItem>
                            {availableCurrencies.map(currency => (
                                <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-10 flex gap-2"
                                style={{borderColor: dateFilter ? theme.primary : undefined}}
                            >
                                <CalendarIcon size={16}/>
                                {dateFilter ? format(dateFilter, 'MMM dd, yyyy') : 'Filter by date'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                                mode="single"
                                selected={dateFilter ?? undefined}
                                onSelect={handleDateSelect}
                                initialFocus
                            />
                            {dateFilter && (
                                <div className="p-2 border-t flex justify-end">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDateFilter(null)}
                                    >
                                        Clear
                                    </Button>
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <Card className="flex-grow overflow-hidden">
                <CardContent className="p-0 h-full">
                    {loading ? (
                        <div className="overflow-x-auto h-full">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sale ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Currency</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead className="w-16">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {renderSkeletons()}
                                </TableBody>
                            </Table>
                        </div>
                    ) : filteredSales.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <FileText size={48} className="mb-4 opacity-30"/>
                            <p className="text-lg font-medium" style={{color: theme.text}}>
                                No sales found
                            </p>
                            <p className="text-sm" style={{color: theme.text}}>
                                {searchQuery || paymentFilter !== 'all' || currencyFilter !== 'all' || dateFilter
                                    ? 'Try changing your search filters'
                                    : 'Create your first sale to see it here'}
                            </p>
                            {(searchQuery || paymentFilter !== 'all' || currencyFilter !== 'all' || dateFilter) && (
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => {
                                        setSearchQuery('')
                                        setPaymentFilter('all')
                                        setCurrencyFilter('all')
                                        setDateFilter(null)
                                    }}
                                >
                                    Clear all filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto h-full">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sale ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Currency</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead className="w-16">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {filteredSales.map(sale => (
                                        <TableRow key={sale.saleId}>
                                            <TableCell className="font-medium">
                                                {sale.saleId}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(sale.saleDate)}
                                            </TableCell>
                                            <TableCell>
                                                {sale.customerName}
                                            </TableCell>
                                            <TableCell>
                                                {sale.products.length} {sale.products.length === 1 ? 'item' : 'items'}
                                            </TableCell>
                                            <TableCell className="font-medium" style={{color: theme.primary}}>
                                                ${Number(sale.totalAmount).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    style={getCurrencyBadgeStyle(sale.currency)}
                                                >
                                                    {sale.currency}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    style={getPaymentBadgeStyle(sale.paymentMethod)}
                                                >
                                                    {formatPaymentMethod(sale.paymentMethod)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleViewSale(sale)}
                                                    style={{color: theme.primary}}
                                                >
                                                    <Eye size={16}/>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChangeAction={handlePageChange}
                onItemsPerPageChangeAction={handleItemsPerPageChange}
                itemName="sales"
            />

            <ReceiptModal
                open={isReceiptModalOpen}
                onClose={handleCloseReceiptModal}
                sale={selectedSale}
                customers={customers}
            />
        </div>
    )
}