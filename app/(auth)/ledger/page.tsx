'use client'

import { useEffect, useState, useMemo } from 'react';
import { Book, CalendarIcon, Eye, FileText, Filter, Search, Trash2, X } from 'lucide-react';
import { theme } from '@/lib/colorPattern';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import Pagination from '@/components/common/Pagination';
import { Skeleton } from '@/components/ui/skeleton';
import ReceiptModal from '@/components/ledger/ReceiptModal';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/stores/AuthContext';
import DeleteSaleModal from '@/components/ledger/DeleteSaleModal';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { SaleHistory, SaleFilter } from '@/lib/types/saleType';
import { useSalesData } from '@/lib/hooks/useSaleData';

export default function LedgerPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSale, setSelectedSale] = useState<SaleHistory | null>(null);
    const [saleToDelete, setSaleToDelete] = useState<SaleHistory | null>(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [paymentFilter, setPaymentFilter] = useState<string>('all');
    const [currencyFilter, setCurrencyFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<Date | null>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [filterSheetOpen, setFilterSheetOpen] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [activeFilters, setActiveFilters] = useState(0);
    const router = useRouter();
    const { userWithRole } = useAuth();
    const isAdmin = userWithRole?.role === 'admin';

    const filters: SaleFilter = useMemo(
        () => ({
            searchQuery,
            paymentFilter,
            currencyFilter,
            dateFilter
        }),
        [searchQuery, paymentFilter, currencyFilter, dateFilter]
    );

    const {
        sales,
        customers,
        loading,
        pagination,
        availableCurrencies,
        fetchPageData,
        setItemsPerPage: setItemsPerPageInHook,
        refreshData
    } = useSalesData(filters);

    useEffect(() => {
        let count = 0;
        if (paymentFilter !== 'all') count++;
        if (currencyFilter !== 'all') count++;
        if (dateFilter !== null) count++;
        setActiveFilters(count);
    }, [paymentFilter, currencyFilter, dateFilter]);

    const handlePageChange = async (page: number) => {
        await fetchPageData(page);
    };

    const handleItemsPerPageChange = (value: string) => {
        const newItemsPerPage = parseInt(value);
        setItemsPerPage(newItemsPerPage);
        setItemsPerPageInHook(newItemsPerPage);
    };

    const handleDeleteSuccess = async () => {
        await refreshData();
        toast.success('Sale deleted successfully');
    };

    const handleConfirmDelete = () => {
        setConfirmDeleteOpen(false);
    };
    const handleOpenConfirmDelete = (sale: SaleHistory) => {
        setSaleToDelete(sale);
        setConfirmDeleteOpen(true);
    };
    const formatPaymentMethod = (method: string) => {
        return method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ');
    };

    const handleViewSale = (sale: SaleHistory) => {
        setSelectedSale(sale);
        setIsReceiptModalOpen(true);
    };

    const handleCloseReceiptModal = () => {
        setIsReceiptModalOpen(false);
        setSelectedSale(null);
    };

    const clearAllFilters = () => {
        setSearchQuery('');
        setPaymentFilter('all');
        setCurrencyFilter('all');
        setDateFilter(null);
        setFilterSheetOpen(false);
    };

    const getPaymentBadgeStyle = (method: string) => {
        switch (method) {
            case 'cash':
                return { backgroundColor: '#4CAF50', color: 'white' };
            case 'card':
                return { backgroundColor: '#2196F3', color: 'white' };
            case 'aba':
                return { backgroundColor: '#0047AB', color: 'white' };
            case 'acleda':
                return { backgroundColor: '#3F00FF', color: 'white' };
            case 'bank_transfer':
                return { backgroundColor: '#9C27B0', color: 'white' };
            default:
                return { backgroundColor: theme.secondary, color: theme.text };
        }
    };

    const getCurrencyBadgeStyle = (currency: string) => {
        switch (currency) {
            case 'USD':
                return { backgroundColor: '#4CAF50', color: 'white' };
            case 'THB':
                return { backgroundColor: '#FF9800', color: 'white' };
            case 'KHR':
                return { backgroundColor: '#9C27B0', color: 'white' };
            default:
                return { backgroundColor: '#607D8B', color: 'white' };
        }
    };

    const handleDateSelect = (day: Date | undefined) => {
        setDateFilter(day || null);
    };

    const renderSkeletons = () => {
        return Array.from({ length: itemsPerPage }).map((_, index) => (
            <TableRow key={`skeleton-${index}`}>
                <TableCell>
                    <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-5 w-32" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell>
                    <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                    <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell>
                    <Skeleton className="h-8 w-8 rounded-full" />
                </TableCell>
            </TableRow>
        ));
    };

    const renderMobileCard = (sale: SaleHistory) => (
        <div key={sale.saleId} className="p-4 border-b last:border-b-0">
            <div className="flex justify-between items-start mb-2">
                <span className="font-medium">{sale.saleId}</span>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewSale(sale)}
                        style={{ color: theme.primary }}
                    >
                        <Eye size={16} />
                    </Button>
                    {isAdmin && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => isAdmin && handleOpenConfirmDelete(sale)}
                            className="text-red-500"
                            disabled={!isAdmin}
                        >
                            <Trash2 size={16} />
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-gray-500">Customer:</span>
                <span>{sale.customerName}</span>

                <span className="text-gray-500">Items:</span>
                <span>
                    {sale.products.length} {sale.products.length === 1 ? 'item' : 'items'}
                </span>

                <span className="text-gray-500">Total:</span>
                <span className="font-medium" style={{ color: theme.primary }}>
                    ${Number(sale.totalAmount).toFixed(2)}
                </span>

                <span className="text-gray-500">Payment:</span>
                <Badge style={getPaymentBadgeStyle(sale.paymentMethod)}>
                    {formatPaymentMethod(sale.paymentMethod)}
                </Badge>

                <span className="text-gray-500">Currency:</span>
                <Badge style={getCurrencyBadgeStyle(sale.currency)}>{sale.currency}</Badge>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center mb-4 md:mb-0">
                    <Book style={{ color: theme.primary }} />
                    <h1 className="ml-2 text-xl md:text-2xl font-bold" style={{ color: theme.primary }}>
                        Sale Ledger
                    </h1>
                    <Button
                        className="ml-4 h-10 px-4"
                        style={{
                            backgroundColor: '#FF4B6A',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                        onClick={() => router.push('/ledger/service-ledger')}
                    >
                        Services
                    </Button>
                </div>
                <div className="hidden md:flex flex-wrap gap-2 w-full md:w-auto">
                    <div className="relative flex-grow md:flex-grow-0">
                        <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                        <Input
                            placeholder="Search sales..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 w-full md:w-64"
                        />
                    </div>

                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                        <SelectTrigger className="h-10 w-full md:w-40">
                            <SelectValue placeholder="Payment" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Payments</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="aba">ABA</SelectItem>
                            <SelectItem value="acleda">Acleda</SelectItem>
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
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="THB">Thai Baht (฿)</SelectItem>
                            <SelectItem value="KHR">Khmer Riel (៛)</SelectItem>
                        </SelectContent>
                    </Select>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-10 flex gap-2"
                                style={{ borderColor: dateFilter ? theme.primary : undefined }}
                            >
                                <CalendarIcon size={16} />
                                {dateFilter ? format(dateFilter, 'MMM dd, yyyy') : 'Filter by date'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                                mode="single"
                                selected={dateFilter ?? undefined}
                                onSelect={handleDateSelect}
                            />
                            {dateFilter && (
                                <div className="p-2 border-t flex justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => setDateFilter(null)}>
                                        Clear
                                    </Button>
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="flex gap-2 w-full md:hidden">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                        <Input
                            placeholder="Search sales..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 w-full"
                        />
                    </div>

                    <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="relative"
                                style={activeFilters > 0 ? { borderColor: theme.primary } : {}}
                            >
                                <Filter size={18} />
                                {activeFilters > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                                        {activeFilters}
                                    </span>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[90vh] rounded-t-xl">
                            <SheetHeader className="mb-4">
                                <SheetTitle>Filter Sales</SheetTitle>
                                <SheetDescription>Apply filters to refine your sales history</SheetDescription>
                            </SheetHeader>

                            <div className="flex flex-col h-full">
                                <div className="flex-1 overflow-y-auto pb-16">
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <label className="text-sm font-medium mb-1 block">Payment Method</label>
                                            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Payment method" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Payments</SelectItem>
                                                    <SelectItem value="cash">Cash</SelectItem>
                                                    <SelectItem value="card">Card</SelectItem>
                                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-1 block">Currency</label>
                                            <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Currency" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Currencies</SelectItem>
                                                    {availableCurrencies.map((currency) => (
                                                        <SelectItem key={currency} value={currency}>
                                                            {currency}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-1 block">Date</label>
                                            <div className="border rounded-md p-3 flex justify-center">
                                                <div className="w-fit max-w-[300px]">
                                                    <CalendarComponent
                                                        mode="single"
                                                        selected={dateFilter ?? undefined}
                                                        onSelect={handleDateSelect}
                                                        className="mx-auto"
                                                    />
                                                </div>
                                            </div>
                                            {dateFilter && (
                                                <div className="flex justify-end mt-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setDateFilter(null)}
                                                        className="text-xs"
                                                    >
                                                        <X size={14} className="mr-1" /> Clear date
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t">
                                    <div className="flex gap-2 max-w-md mx-auto">
                                        <Button variant="outline" className="flex-1" onClick={clearAllFilters}>
                                            Clear All
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            style={{ backgroundColor: theme.primary, color: 'white' }}
                                            onClick={() => setFilterSheetOpen(false)}
                                        >
                                            Apply Filters
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Active filters display for mobile */}
            {activeFilters > 0 && (
                <div className="md:hidden flex flex-wrap gap-2 mb-4">
                    {paymentFilter !== 'all' && (
                        <Badge variant="outline" className="flex items-center gap-1">
                            {formatPaymentMethod(paymentFilter)}
                            <X
                                size={14}
                                className="ml-1 cursor-pointer"
                                onClick={() => setPaymentFilter('all')}
                            />
                        </Badge>
                    )}
                    {currencyFilter !== 'all' && (
                        <Badge variant="outline" className="flex items-center gap-1">
                            {currencyFilter}
                            <X
                                size={14}
                                className="ml-1 cursor-pointer"
                                onClick={() => setCurrencyFilter('all')}
                            />
                        </Badge>
                    )}
                    {dateFilter && (
                        <Badge variant="outline" className="flex items-center gap-1">
                            {format(dateFilter, 'MMM dd, yyyy')}
                            <X
                                size={14}
                                className="ml-1 cursor-pointer"
                                onClick={() => setDateFilter(null)}
                            />
                        </Badge>
                    )}
                </div>
            )}

            <Card className="flex-grow">
                <CardContent className="p-0 h-full">
                    {loading ? (
                        <div className="overflow-x-auto h-full">
                            <Table className="min-w-[640px] md:w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sale ID</TableHead>
                                        <TableHead className="hidden md:table-cell">Customer</TableHead>
                                        <TableHead className="hidden md:table-cell">Items</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead className="hidden md:table-cell">Paid In</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead className="w-16">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {renderSkeletons()}
                                </TableBody>
                            </Table>
                        </div>
                    ) : sales.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <FileText size={48} className="mb-4 opacity-30" />
                            <p className="text-lg font-medium" style={{ color: theme.text }}>
                                No sales found
                            </p>
                            <p className="text-sm text-center px-4" style={{ color: theme.text }}>
                                {searchQuery || paymentFilter !== 'all' || currencyFilter !== 'all' || dateFilter
                                    ? 'Try changing your search filters'
                                    : 'Create your first sale to see it here'}
                            </p>
                            {(searchQuery || paymentFilter !== 'all' || currencyFilter !== 'all' || dateFilter) && (
                                <Button variant="outline" className="mt-4" onClick={clearAllFilters}>
                                    Clear all filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto h-full">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Sale ID</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Items</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Paid In</TableHead>
                                            <TableHead>Payment</TableHead>
                                            <TableHead className="w-24">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sales.map((sale) => (
                                            <TableRow key={sale.saleId}>
                                                <TableCell className="font-medium">{sale.saleId}</TableCell>
                                                <TableCell>{sale.customerName}</TableCell>
                                                <TableCell>
                                                    {sale.products.length} {sale.products.length === 1 ? 'item' : 'items'}
                                                </TableCell>
                                                <TableCell className="font-medium" style={{ color: theme.primary }}>
                                                    ${Number(sale.totalAmount).toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge style={getCurrencyBadgeStyle(sale.currency)}>
                                                        {sale.currency}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge style={getPaymentBadgeStyle(sale.paymentMethod)}>
                                                        {formatPaymentMethod(sale.paymentMethod)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleViewSale(sale)}
                                                        >
                                                            <Eye size={20} />
                                                        </Button>
                                                        {isAdmin && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleOpenConfirmDelete(sale)}
                                                                className="text-red-500"
                                                                disabled={!isAdmin}
                                                            >
                                                                <Trash2 size={20} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden max-h-[calc(100vh-300px)] overflow-y-auto">
                                {sales.map((sale) => renderMobileCard(sale))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                itemsPerPage={pagination.itemsPerPage}
                onPageChangeAction={handlePageChange}
                onItemsPerPageChangeAction={handleItemsPerPageChange}
                itemName="sales"
            />

            <ReceiptModal
                open={isReceiptModalOpen}
                onClose={handleCloseReceiptModal}
                transactionData={selectedSale}
                customers={customers}
                transactionType="sale"
            />

            <Dialog open={confirmDeleteOpen} onOpenChange={(open) => !open && setConfirmDeleteOpen(false)}>
                <DialogContent
                    className="[&>button]:hidden"
                    onEscapeKeyDown={(e) => e.preventDefault()}
                    onPointerDownOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle style={{ color: theme.primary }}>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this sale? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {saleToDelete && (
                        <div className="py-4">
                            <div className="p-3 rounded-md" style={{ backgroundColor: theme.light }}>
                                <p className="font-medium" style={{ color: theme.text }}>
                                    {saleToDelete.saleId}
                                </p>
                                <p className="text-sm" style={{ color: theme.text }}>
                                    Customer: {saleToDelete.customerName}
                                </p>
                                <p className="text-sm" style={{ color: theme.text }}>
                                    Items: {saleToDelete.products.length}{' '}
                                    {saleToDelete.products.length === 1 ? 'item' : 'items'}
                                </p>
                                <p className="text-sm" style={{ color: theme.text }}>
                                    Total: ${Number(saleToDelete.totalAmount).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setConfirmDeleteOpen(false);
                                setSaleToDelete(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={loading || !isAdmin}
                        >
                            <Trash2 size={16} className="mr-2" />
                            Proceed to Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DeleteSaleModal
                open={!!saleToDelete && !confirmDeleteOpen}
                onClose={() => setSaleToDelete(null)}
                sale={saleToDelete}
                onSuccess={handleDeleteSuccess}
            />
        </div>
    );
}