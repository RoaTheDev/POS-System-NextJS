'use client'
import {theme} from "@/lib/colorPattern";
import { useEffect, useState } from 'react'
import { useProductStore } from '@/lib/stores/productStore'
import { Product, ProductFormData } from '@/lib/types/product'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Card,
    CardContent,
} from '@/components/ui/card'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast, Toaster } from 'sonner'
import ProductForm from '@/components/products/ProductForm'
import { Edit, Home, Package, Plus, Search, ShoppingCart, Trash2, User } from 'lucide-react'
import Image from 'next/image'

const categories = ['All', 'Beverages', 'Food', 'Pastries', 'Dessert', 'Merchandise'];

export default function ProductsPage() {
    const {
        products,
        isLoading,
        error,
        fetchProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        searchProducts
    } = useProductStore()

    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [activePage, setActivePage] = useState('products')

    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(async () => {
            await searchProducts(searchTerm, selectedCategory === 'All' ? undefined : selectedCategory)
        }, 300)

        return () => clearTimeout(timer)
    }, [searchTerm, selectedCategory, searchProducts])

    const handleAddProduct = async (data: ProductFormData) => {
        try {
            await addProduct(data)
            setIsAddDialogOpen(false)
            toast.success('Product added successfully')
        } catch (error) {
            toast.error(`Failed to add product: ${(error as Error).message}`)
        }
    }

    const handleUpdateProduct = async (data: ProductFormData) => {
        if (!editingProduct) return

        try {
            await updateProduct(editingProduct.productId, data)
            setIsEditDialogOpen(false)
            setEditingProduct(null)
            toast.success('Product updated successfully')
        } catch (error) {
            toast.error(`Failed to update product: ${(error as Error).message}`)
        }
    }

    const handleDeleteProduct = async () => {
        if (!deleteProductId) return

        try {
            await deleteProduct(deleteProductId)
            setIsDeleteDialogOpen(false)
            setDeleteProductId(null)
            toast.success('Product deleted successfully')
        } catch (error) {
            toast.error(`Failed to delete product: ${(error as Error).message}`)
        }
    }

    const openEditDialog = (product: Product) => {
        setEditingProduct(product)
        setIsEditDialogOpen(true)
    }

    const openDeleteDialog = (productId: string) => {
        setDeleteProductId(productId)
        setIsDeleteDialogOpen(true)
    }

    const Sidebar = () => {
        return (
            <div
                className='hidden lg:block w-64 h-full bg-white shadow-lg'
                style={{ backgroundColor: theme.light }}
            >
                <div className='p-4'>
                    <h1 className='text-xl font-bold' style={{ color: theme.primary }}>Elizabeth Rose POS</h1>
                </div>

                <nav className='p-4'>
                    <ul className='space-y-2'>
                        <li>
                            <button
                                onClick={() => setActivePage('dashboard')}
                                className={`flex w-full items-center p-3 rounded-lg ${
    activePage === 'dashboard' ? 'text-white' : `hover:bg-opacity-10 hover:bg-gray-100`
}`}
                                style={{
                                    backgroundColor: activePage === 'dashboard' ? theme.primary : 'transparent',
                                    color: activePage === 'dashboard' ? 'white' : theme.text
                                }}
                            >
                                <Home className='mr-3' size={20} />
                                <span>Dashboard</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActivePage('products')}
                                className={`flex w-full items-center p-3 rounded-lg ${
    activePage === 'products' ? 'text-white' : `hover:bg-opacity-10 hover:bg-gray-100`
}`}
                                style={{
                                    backgroundColor: activePage === 'products' ? theme.primary : 'transparent',
                                    color: activePage === 'products' ? 'white' : theme.text
                                }}
                            >
                                <Package className='mr-3' size={20} />
                                <span>Products</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActivePage('sales')}
                                className={`flex w-full items-center p-3 rounded-lg ${
    activePage === 'sales' ? 'text-white' : `hover:bg-opacity-10 hover:bg-gray-100`
}`}
                                style={{
                                    backgroundColor: activePage === 'sales' ? theme.primary : 'transparent',
                                    color: activePage === 'sales' ? 'white' : theme.text
                                }}
                            >
                                <ShoppingCart className='mr-3' size={20} />
                                <span>Sales</span>
                            </button>
                        </li>
                    </ul>
                </nav>

                <div className='absolute bottom-0 w-64 p-4 border-t' style={{ borderColor: theme.secondary }}>
                    <div className='flex items-center'>
                        <div
                            className='w-10 h-10 rounded-full mr-3 flex items-center justify-center'
                            style={{ backgroundColor: theme.secondary }}
                        >
                            <User size={20} style={{ color: theme.primary }} />
                        </div>
                        <div>
                            <p className='font-medium' style={{ color: theme.text }}>Staff User</p>
                            <button className='text-sm flex items-center' style={{ color: theme.primary }}>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const MobileBottomNav = () => {
        return (
            <div
                className='lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-30 flex justify-around items-center h-16'
                style={{ backgroundColor: theme.light, borderColor: theme.secondary }}
            >
                <button
                    onClick={() => setActivePage('dashboard')}
                    className='flex flex-col items-center justify-center w-1/3 h-full'
                >
                    <Home size={24} style={{ color: activePage === 'dashboard' ? theme.primary : theme.text }} />
                    <span
                        className='text-xs mt-1'
                        style={{ color: activePage === 'dashboard' ? theme.primary : theme.text }}
                    >
                        Dashboard
                    </span>
                </button>

                <button
                    onClick={() => setActivePage('products')}
                    className='flex flex-col items-center justify-center w-1/3 h-full'
                >
                    <Package size={24} style={{ color: activePage === 'products' ? theme.primary : theme.text }} />
                    <span
                        className='text-xs mt-1'
                        style={{ color: activePage === 'products' ? theme.primary : theme.text }}
                    >
                        Products
                    </span>
                </button>

                <button
                    onClick={() => setActivePage('sales')}
                    className='flex flex-col items-center justify-center w-1/3 h-full'
                >
                    <ShoppingCart size={24} style={{ color: activePage === 'sales' ? theme.primary : theme.text }} />
                    <span
                        className='text-xs mt-1'
                        style={{ color: activePage === 'sales' ? theme.primary : theme.text }}
                    >
                        Sales
                    </span>
                </button>
            </div>
        )
    }

    return (
        <div className='flex h-screen bg-gray-50' style={{ backgroundColor: theme.background }}>
            <Toaster
                richColors
                toastOptions={{
                    style: {
                        backgroundColor: theme.light,
                        color: theme.text,
                        borderColor: theme.accent,
                    },
                }}
            />

            <Sidebar />

            <div className='flex-1 flex flex-col overflow-hidden'>
                <header className='bg-white shadow-sm z-10' style={{ backgroundColor: theme.light }}>
                    <div className='px-4 py-4 flex items-center justify-between'>
                        <div className='lg:hidden'>
                            <h1 className='text-lg font-bold' style={{ color: theme.primary }}>Elizabeth Rose POS</h1>
                        </div>

                        <div className='flex items-center space-x-3'>
                            <div
                                className='w-8 h-8 rounded-full flex items-center justify-center'
                                style={{ backgroundColor: theme.secondary }}
                            >
                                <User size={16} style={{ color: theme.primary }} />
                            </div>
                        </div>
                    </div>
                </header>

                <main className='flex-1 overflow-y-auto p-4 pb-20 lg:pb-0'>
                    <div className='space-y-6'>
                        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6'>
                            <h1 className='text-2xl font-bold' style={{ color: theme.text }}>Products</h1>

                            <div className='flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0'>
                                <div className='relative'>
                                    <Input
                                        type='text'
                                        placeholder='Search products...'
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className='pl-10'
                                        style={{ borderColor: theme.accent }}
                                    />
                                    <Search
                                        className='absolute left-3 top-2.5'
                                        size={18}
                                        style={{ color: theme.primary }}
                                    />
                                </div>
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger
                                        className='w-full sm:w-40'
                                        style={{ borderColor: theme.accent }}
                                    >
                                        <SelectValue placeholder='Category' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(category => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            style={{
                                                backgroundColor: theme.primary,
                                                color: 'white'
                                            }}
                                        >
                                            <Plus size={16} className='mr-1' /> Add Product
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className='sm:max-w-[600px]'>
                                        <DialogHeader>
                                            <DialogTitle>Add New Product</DialogTitle>
                                        </DialogHeader>
                                        <ProductForm
                                            onSubmitAction={handleAddProduct} // Changed from onSubmit to onSubmitAction
                                            isLoading={isLoading}
                                            categories={categories.filter(c => c !== 'All')}
                                        />
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        {/* Products List */}
                        <Card>
                            <CardContent className='p-0'>
                                <div className='overflow-x-auto'>
                                    <table className='w-full'>
                                        <thead>
                                            <tr
                                                className='border-b'
                                                style={{
                                                    backgroundColor: theme.light,
                                                    borderColor: theme.secondary
                                                }}
                                            >
                                                <th className='text-left py-3 px-4' style={{ color: theme.text }}>Image</th>
                                                <th className='text-left py-3 px-4' style={{ color: theme.text }}>Name</th>
                                                <th className='text-left py-3 px-4 hidden sm:table-cell' style={{ color: theme.text }}>
                                                    Category
                                                </th>
                                                <th className='text-left py-3 px-4' style={{ color: theme.text }}>Price</th>
                                                <th className='text-left py-3 px-4' style={{ color: theme.text }}>Stock</th>
                                                <th className='text-left py-3 px-4' style={{ color: theme.text }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isLoading && !products.length ? (
                                                <tr>
                                                    <td colSpan={6} className='py-8 text-center text-gray-500'>
                                                        Loading products...
                                                    </td>
                                                </tr>
                                            ) : error ? (
                                                <tr>
                                                    <td colSpan={6} className='py-8 text-center text-red-500'>
                                                        Error: {error.message || 'An error occurred'} {/* Updated to use error.message */}
                                                    </td>
                                                </tr>
                                            ) : products.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className='py-8 text-center text-gray-500'>
                                                        No products found. Add your first product!
                                                    </td>
                                                </tr>
                                            ) : (
                                                products.map(product => (
                                                    <tr
                                                        key={product.productId}
                                                        className='border-b hover:bg-gray-50'
                                                        style={{ borderColor: theme.secondary }}
                                                    >
                                                        <td className='py-3 px-4'>
                                                            <div className='w-12 h-12 rounded overflow-hidden bg-gray-100'>
                                                                {product.productImgUrl ? (
                                                                    <Image
                                                                        src={product.productImgUrl}
                                                                        alt={product.productName}
                                                                        className='w-full h-full object-cover'
                                                                    />
                                                                ) : (
                                                                    <div className='w-full h-full flex items-center justify-center'>
                                                                        <Package size={20} style={{ color: theme.primary }} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className='py-3 px-4'>{product.productName}</td>
                                                        <td className='py-3 px-4 hidden sm:table-cell'>
                                                            <span
                                                                className='px-2 py-1 rounded-full text-xs'
                                                                style={{
                                                                    backgroundColor: theme.secondary,
                                                                    color: theme.text
                                                                }}
                                                            >
                                                                {product.categoryName}
                                                            </span>
                                                        </td>
                                                        <td className='py-3 px-4'>${product.price.toFixed(2)}</td>
                                                        <td className='py-3 px-4'>
                                                            <span
                                                                className={`px-2 py-1 rounded-full text-xs ${
    product.stock < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
}`}
                                                            >
                                                                {product.stock}
                                                            </span>
                                                        </td>
                                                        <td className='py-3 px-4'>
                                                            <div className='flex space-x-2'>
                                                                <Button
                                                                    variant='outline'
                                                                    size='sm'
                                                                    onClick={() => openEditDialog(product)}
                                                                    style={{
                                                                        borderColor: theme.accent,
                                                                        color: theme.text
                                                                    }}
                                                                >
                                                                    <Edit size={14} />
                                                                </Button>
                                                                <Button
                                                                    variant='outline'
                                                                    size='sm'
                                                                    onClick={() => openDeleteDialog(product.productId)}
                                                                    style={{
                                                                        borderColor: '#EF4444',
                                                                        color: '#EF4444'
                                                                    }}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Edit Product Dialog */}
                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogContent className='sm:max-w-[600px]'>
                                <DialogHeader>
                                    <DialogTitle>Edit Product</DialogTitle>
                                </DialogHeader>
                                {editingProduct && (
                                    <ProductForm
                                        onSubmitAction={handleUpdateProduct} // Changed from onSubmit to onSubmitAction
                                        initialData={editingProduct}
                                        isLoading={isLoading}
                                        categories={categories.filter(c => c !== 'All')}
                                    />
                                )}
                            </DialogContent>
                        </Dialog>

                        {/* Delete Confirmation Dialog */}
                        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the product
                                        and remove the data from the server.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDeleteProduct}
                                        style={{
                                            backgroundColor: '#EF4444',
                                            color: 'white'
                                        }}
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </main>
            </div>

            <MobileBottomNav />
        </div>
    )
}
