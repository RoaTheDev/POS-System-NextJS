'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    FileEdit,
    Filter,
    Plus,
    RefreshCcw,
    Search,
    Trash2,
    User,
    UserPlus,
    Users,
} from 'lucide-react';
import { addDoc, collection, deleteDoc, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { theme } from '@/lib/colorPattern';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { useCustomers } from '@/lib/queries/saleQueries';
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {Customer} from "@/lib/stores/saleStore";



export default function CustomerManagementPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddingCustomer, setIsAddingCustomer] = useState(false);
    const [isEditingCustomer, setIsEditingCustomer] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);
    const [filterOption, setFilterOption] = useState('all');

    const { data: customersData, isLoading: isLoadingCustomers, refetch } = useCustomers();
    useRouter();

    const filteredCustomers = customersData?.filter(customer => {
        const matchesSearch = searchQuery.trim() === '' ||
            customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.phone.toString().includes(searchQuery) ||
            (customer.address && customer.address.toLowerCase().includes(searchQuery.toLowerCase()));

        if (filterOption === 'all') return matchesSearch;
        if (filterOption === 'with_address') return matchesSearch && customer.address && customer.address.trim() !== '';
        if (filterOption === 'without_address') return matchesSearch && (!customer.address || customer.address.trim() === '');

        return matchesSearch;
    }) || [];

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

            await addDoc(collection(db, 'customers'), customerData);

            setIsAddingCustomer(false);
            setNewCustomer({name: '', phone: '', address: ''});
            await refetch();

            toast.success('Customer added successfully');
        } catch (error) {
            console.error('Error adding customer:', error);
            toast.error('Failed to add customer');
        } finally {
            setLoading(false);
        }
    };

    const handleEditCustomer = async () => {
        if (!customerToEdit || !customerToEdit.name || !customerToEdit.phone) {
            toast.error('Name and phone are required');
            return;
        }

        try {
            setLoading(true);

            const customerRef = doc(db, 'customers', customerToEdit.id);
            await updateDoc(customerRef, {
                name: customerToEdit.name,
                phone: Number(customerToEdit.phone),
                address: customerToEdit.address
            });

            setIsEditingCustomer(false);
            setCustomerToEdit(null);
            await refetch();

            toast.success('Customer updated successfully');
        } catch (error) {
            console.error('Error updating customer:', error);
            toast.error('Failed to update customer');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCustomer = async () => {
        if (!customerToDelete) return;

        try {
            setLoading(true);
            await deleteDoc(doc(db, 'customers', customerToDelete.id));
            setCustomerToDelete(null);
            await refetch();
            toast.success('Customer deleted successfully');
        } catch (error) {
            console.error('Error deleting customer:', error);
            toast.error('Failed to delete customer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>
                    <Users className="inline mr-2 mb-1" size={24} />
                    Customer Management
                </h1>
                <Link href="/sales">
                    <Button variant="outline" style={{ borderColor: theme.primary, color: theme.primary }}>
                        Back to Sales
                    </Button>
                </Link>
                <div></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Customer List */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle style={{ color: theme.primary }}>Customers</CardTitle>
                            <div className="flex gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <Filter size={16} className="mr-2" />
                                            Filter
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setFilterOption('all')}>
                                            All Customers
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setFilterOption('with_address')}>
                                            With Address
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setFilterOption('without_address')}>
                                            Without Address
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                    size="sm"
                                    onClick={() => setIsAddingCustomer(true)}
                                    style={{ backgroundColor: theme.primary }}
                                >
                                    <UserPlus size={16} className="mr-2" />
                                    Add Customer
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                <Input
                                    placeholder="Search customers by name, phone, or address..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {isLoadingCustomers ? (
                                <div className="flex items-center justify-center h-40">
                                    <RefreshCcw size={24} className="animate-spin mr-2" />
                                    <p style={{ color: theme.text }}>Loading customers...</p>
                                </div>
                            ) : filteredCustomers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-center">
                                    <User size={32} className="mb-2 opacity-50" />
                                    <p style={{ color: theme.text }}>
                                        No customers found. Try a different search term or add a new customer.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                                    {filteredCustomers.map((customer) => (
                                        <div
                                            key={customer.customerId}
                                            className="flex items-center justify-between p-3 rounded-md hover:bg-opacity-80 transition-colors"
                                            style={{ backgroundColor: theme.light }}
                                        >
                                            <div className="flex items-start space-x-3">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                                    style={{ backgroundColor: theme.secondary }}
                                                >
                                                    <User size={16} style={{ color: theme.primary }} />
                                                </div>
                                                <div>
                                                    <p className="font-medium" style={{ color: theme.text }}>
                                                        {customer.name}
                                                    </p>
                                                    <p className="text-sm" style={{ color: theme.text }}>
                                                        {customer.phone}
                                                    </p>
                                                    {customer.address && (
                                                        <p className="text-sm" style={{ color: theme.text }}>
                                                            {customer.address}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setCustomerToEdit(customer);
                                                        setIsEditingCustomer(true);
                                                    }}
                                                    style={{ color: theme.primary }}
                                                >
                                                    <FileEdit size={16} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setCustomerToDelete(customer)}
                                                    className="text-red-500"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Statistics */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle style={{ color: theme.primary }}>Customer Statistics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-4 rounded-md" style={{ backgroundColor: theme.light }}>
                                    <h3 className="font-medium mb-2" style={{ color: theme.primary }}>
                                        Total Customers
                                    </h3>
                                    <p className="text-3xl font-bold" style={{ color: theme.dark }}>
                                        {customersData?.length || 0}
                                    </p>
                                </div>

                                <div className="p-4 rounded-md" style={{ backgroundColor: theme.light }}>
                                    <h3 className="font-medium mb-2" style={{ color: theme.primary }}>
                                        With Address
                                    </h3>
                                    <p className="text-3xl font-bold" style={{ color: theme.dark }}>
                                        {customersData?.filter(c => c.address && c.address.trim() !== '').length || 0}
                                    </p>
                                </div>

                                <Separator className="my-4" style={{ backgroundColor: theme.secondary }} />

                                <div className="p-4 rounded-md" style={{ backgroundColor: theme.light }}>
                                    <h3 className="font-medium mb-2" style={{ color: theme.primary }}>
                                        Latest Customers
                                    </h3>
                                    <div className="space-y-2">
                                        {customersData?.slice(0, 5).map((customer) => (
                                            <div key={customer.customerId} className="flex items-center space-x-2">
                                                <Badge style={{ backgroundColor: theme.secondary, color: theme.text }}>
                                                    {new Date(customer.createdAt.toDate()).toLocaleDateString()}
                                                </Badge>
                                                <p style={{ color: theme.text }}>{customer.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Add Customer Dialog */}
            <Dialog open={isAddingCustomer} onOpenChange={setIsAddingCustomer}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle style={{ color: theme.primary }}>Add New Customer</DialogTitle>
                        <DialogDescription>
                            Fill out the form below to add a new customer to your database.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label style={{ color: theme.text }}>Customer Name*</label>
                            <Input
                                placeholder="Enter customer name"
                                value={newCustomer.name}
                                onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label style={{ color: theme.text }}>Phone Number*</label>
                            <Input
                                placeholder="Enter phone number"
                                type="tel"
                                value={newCustomer.phone}
                                onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label style={{ color: theme.text }}>Address (Optional)</label>
                            <Input
                                placeholder="Enter address"
                                value={newCustomer.address}
                                onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddingCustomer(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddCustomer}
                            disabled={loading}
                            style={{ backgroundColor: theme.primary }}
                        >
                            {loading ? (
                                <>
                                    <RefreshCcw size={16} className="mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <Plus size={16} className="mr-2" />
                                    Add Customer
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Customer Dialog */}
            <Dialog open={isEditingCustomer} onOpenChange={setIsEditingCustomer}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle style={{ color: theme.primary }}>Edit Customer</DialogTitle>
                        <DialogDescription>
                            Update the customer information below.
                        </DialogDescription>
                    </DialogHeader>
                    {customerToEdit && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label style={{ color: theme.text }}>Customer Name*</label>
                                <Input
                                    placeholder="Enter customer name"
                                    value={customerToEdit.name}
                                    onChange={(e) => setCustomerToEdit(prev => ({ ...prev!, name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label style={{ color: theme.text }}>Phone Number*</label>
                                <Input
                                    placeholder="Enter phone number"
                                    type="tel"
                                    value={customerToEdit.phone}
                                    onChange={(e) => setCustomerToEdit(prev => ({ ...prev!, phone: Number(e.target.value) || prev!.phone }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label style={{ color: theme.text }}>Address (Optional)</label>
                                <Input
                                    placeholder="Enter address"
                                    value={customerToEdit.address}
                                    onChange={(e) => setCustomerToEdit(prev => ({ ...prev!, address: e.target.value }))}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditingCustomer(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditCustomer}
                            disabled={loading}
                            style={{ backgroundColor: theme.primary }}
                        >
                            {loading ? (
                                <>
                                    <RefreshCcw size={16} className="mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <FileEdit size={16} className="mr-2" />
                                    Update Customer
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle style={{ color: theme.primary }}>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this customer? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {customerToDelete && (
                        <div className="py-4">
                            <div className="p-3 rounded-md" style={{ backgroundColor: theme.light }}>
                                <p className="font-medium" style={{ color: theme.text }}>
                                    {customerToDelete.name}
                                </p>
                                <p className="text-sm" style={{ color: theme.text }}>
                                    {customerToDelete.phone}
                                </p>
                                {customerToDelete.address && (
                                    <p className="text-sm" style={{ color: theme.text }}>
                                        {customerToDelete.address}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCustomerToDelete(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteCustomer}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <RefreshCcw size={16} className="mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 size={16} className="mr-2" />
                                    Delete Customer
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}