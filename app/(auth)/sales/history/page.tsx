'use client'

import {ProductType} from "@/lib/types/productType";
import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowLeft, CalendarIcon, Eye, FileText, Printer, Search, User} from 'lucide-react'
import {collection, getDocs, orderBy, query, Timestamp} from 'firebase/firestore'
import {db} from '@/lib/firebase'
import {theme} from '@/lib/colorPattern'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {Calendar as CalendarComponent} from '@/components/ui/calendar'
import {format} from 'date-fns'
import {Customer} from "@/lib/stores/saleStore";
import {Sale} from "@/lib/types/saleType";


export default function SalesHistoryPage() {
    const [sales, setSales] = useState<Sale[]>([])
    const [customers, setCustomers] = useState<Record<string, Customer>>({})
    const [products, setProducts] = useState<Record<string, ProductType>>({})
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
    const [paymentFilter, setPaymentFilter] = useState<string>('all')
    const [dateFilter, setDateFilter] = useState<Date | null>(null)

    const router = useRouter()

    // Fetch sales data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)


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
                const productsQuery = query(collection(db, 'products'))
                const productsSnapshot = await getDocs(productsQuery)
                const productsMap: Record<string, ProductType> = {}

                productsSnapshot.docs.forEach(doc => {
                    const productData = doc.data() as ProductType
                    productsMap[productData.productId] = productData
                })
                setProducts(productsMap)

                // Fetch sales
                const salesQuery = query(collection(db, 'sales'), orderBy('saleDate', 'desc'))
                const salesSnapshot = await getDocs(salesQuery)

                const salesData = salesSnapshot.docs.map(doc => {
                    const data = doc.data() as Sale;
                    return {
                        id: doc.id, // Use Firestore document ID
                        saleId: data.saleId,
                        customerId: data.customerId,
                        products: data.products.map(product => ({
                            ...product,
                            productName: productsMap[product.productId]?.productName || 'Unknown ProductType'
                        })),
                        totalAmount: data.totalAmount,
                        paymentMethod: data.paymentMethod,
                        saleDate: data.saleDate,
                        customerName: customersMap[data.customerId]?.name || 'Unknown'
                    };
                });

                setSales(salesData)
            } catch (error) {
                console.error('Error fetching sales data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    // Filter sales based on search query, payment method, and date
    const filteredSales = sales.filter(sale => {
        // Search filter
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch = sale.saleId.toLowerCase().includes(searchLower) ||
            sale.customerName?.toLowerCase().includes(searchLower) ||
            sale.products.some(p => p.productName?.toLowerCase().includes(searchLower))

        // Payment method filter
        const matchesPayment = paymentFilter === 'all' || sale.paymentMethod === paymentFilter

        // Date filter
        const matchesDate = !dateFilter ||
            (dateFilter && format(sale.saleDate.toDate(), 'yyyy-MM-dd') === format(dateFilter, 'yyyy-MM-dd'))

        return matchesSearch && matchesPayment && matchesDate
    })

    // Format date
    const formatDate = (timestamp: Timestamp) => {
        return format(timestamp.toDate(), 'MMM dd, yyyy • h:mm a')
    }

    // Format payment method
    const formatPaymentMethod = (method: string) => {
        return method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ')
    }

    // View sale details
    const handleViewSale = (sale: Sale) => {
        setSelectedSale(sale)
    }

    // Get payment method badge color
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

    // Handle calendar date selection
    const handleDateSelect = (day: Date | undefined) => {
        setDateFilter(day || null)
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
                        <div className="flex items-center justify-center h-64">
                            <p style={{color: theme.text}}>Loading sales data...</p>
                        </div>
                    ) : filteredSales.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <FileText size={48} className="mb-4 opacity-30"/>
                            <p className="text-lg font-medium" style={{color: theme.text}}>
                                No sales found
                            </p>
                            <p className="text-sm" style={{color: theme.text}}>
                                {searchQuery || paymentFilter !== 'all' || dateFilter
                                    ? 'Try changing your search filters'
                                    : 'Create your first sale to see it here'}
                            </p>
                            {(searchQuery || paymentFilter !== 'all' || dateFilter) && (
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => {
                                        setSearchQuery('')
                                        setPaymentFilter('all')
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

            {/* Sale details dialog */}
            <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle style={{color: theme.primary}}>
                            Sale Details - {selectedSale?.saleId}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedSale && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Sale information */}
                                <Card>
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-base" style={{color: theme.primary}}>
                                            Sale Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="py-2">
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm" style={{color: theme.text}}>Date:</span>
                                                <span
                                                    className="text-sm font-medium">{formatDate(selectedSale.saleDate)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm"
                                                      style={{color: theme.text}}>Payment Method:</span>
                                                <Badge style={getPaymentBadgeStyle(selectedSale.paymentMethod)}>
                                                    {formatPaymentMethod(selectedSale.paymentMethod)}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm"
                                                      style={{color: theme.text}}>Total Amount:</span>
                                                <span className="text-sm font-bold" style={{color: theme.primary}}>
                                                    ${Number(selectedSale.totalAmount).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Customer information */}
                                <Card>
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-base" style={{color: theme.primary}}>
                                            Customer Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="py-2">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <User size={16} style={{color: theme.primary}}/>
                                                <span className="font-medium">{selectedSale.customerName}</span>
                                            </div>
                                            <div className="text-sm">
                                                {customers[selectedSale.customerId]?.phone && (
                                                    <p>Phone: {customers[selectedSale.customerId]?.phone}</p>
                                                )}
                                                {customers[selectedSale.customerId]?.address && (
                                                    <p>Address: {customers[selectedSale.customerId]?.address}</p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Products */}
                            <Card>
                                <CardHeader className="py-3">
                                    <CardTitle className="text-base" style={{color: theme.primary}}>
                                        Products Purchased
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="py-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Product</TableHead>
                                                <TableHead className="text-right">Price</TableHead>
                                                <TableHead className="text-right">Quantity</TableHead>
                                                <TableHead className="text-right">Subtotal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedSale.products.map((product, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{product.productName}</TableCell>
                                                    <TableCell
                                                        className="text-right">${product.price.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">{product.quantity}</TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        ${(product.price * product.quantity).toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-right font-bold">
                                                    Total
                                                </TableCell>
                                                <TableCell className="text-right font-bold"
                                                           style={{color: theme.primary}}>
                                                    ${Number(selectedSale.totalAmount).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {/* Actions */}
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    style={{borderColor: theme.primary, color: theme.primary}}
                                    onClick={() => setSelectedSale(null)}
                                >
                                    Close
                                </Button>
                                <Button
                                    style={{backgroundColor: theme.primary}}
                                    onClick={() => {
                                        console.log('Print receipt for sale:', selectedSale.saleId)
                                        window.alert('Printing receipt for sale: ' + selectedSale.saleId)
                                    }}
                                >
                                    <Printer size={16} className="mr-2"/> Print Receipt
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}