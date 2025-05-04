'use client';
import {theme} from "@/lib/colorPattern";
import {useEffect, useState} from 'react';
import {usePathname} from 'next/navigation';
import {useProductStore} from '@/lib/stores/productStore';
import {ProductFormData, ProductType} from '@/lib/types/productType';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {Card, CardContent} from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {toast, Toaster} from 'sonner';
import ProductForm from '@/components/products/ProductForm';
import {Edit, Package, Plus, Search, Trash2} from 'lucide-react';
import Pagination from '@/components/common/Pagination';
import CachedImage from '@/components/common/CacheImage';
import {useQueryClient} from '@tanstack/react-query';
import {
    useAddProduct,
    useDeleteProduct,
    useFetchProducts,
    useSearchProducts,
    useUpdateProduct
} from '@/lib/queries/productQueries';


const categories = [
    'All',
    'Speaker accessories',
    'Amplifier accessories',
    'Connector',
    'Amplifier',
    'Subwoofer/solo',
    'Speaker',
    'Mixer/power',
    'Driver unit',
    'Microphone',
    'Repair'
];

export default function ProductsPage() {
    const {error} = useProductStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const pathname = usePathname();
    const queryClient = useQueryClient();

    const fetchProductsQuery = useFetchProducts(itemsPerPage);
    const addProductMutation = useAddProduct();
    const updateProductMutation = useUpdateProduct();
    const deleteProductMutation = useDeleteProduct();
    const searchProductsQuery = useSearchProducts(
        searchTerm,
        selectedCategory === 'All' ? undefined : selectedCategory,
        itemsPerPage
    );

    const isSearching = searchTerm || selectedCategory !== 'All';

    const activeQuery = isSearching ? searchProductsQuery : fetchProductsQuery;

    const products: ProductType[] = activeQuery.data?.products || [];
    const totalProducts = activeQuery.data?.totalProducts || 0;
    const totalPages = activeQuery.data?.totalPages || 1;

    useEffect(() => {
        if (!isAddDialogOpen && !isEditDialogOpen && !isDeleteDialogOpen) {
            window.scrollTo(0, 0);
        }
    }, [pathname, isAddDialogOpen, isEditDialogOpen, isDeleteDialogOpen]);

    useEffect(() => {
        if (!activeQuery.data) {
            fetchProductsQuery.refetch();
        }
    }, [activeQuery.data, itemsPerPage, fetchProductsQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isSearching) {
                setCurrentPage(1);
                searchProductsQuery.refetch();
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [isSearching, searchTerm, selectedCategory, itemsPerPage, searchProductsQuery]);

    const handleAddProduct = async (data: ProductFormData) => {
        try {
            await addProductMutation.mutateAsync(data);
            setIsAddDialogOpen(false);
            toast.success('Product added successfully');
            await queryClient.invalidateQueries({queryKey: ['products']});
            await fetchProductsQuery.refetch();
        } catch (error) {
            toast.error(`Failed to add product: ${(error as Error).message}`);
        }
    };

    const handleUpdateProduct = async (data: ProductFormData) => {
        if (!editingProduct) return;

        try {
            await updateProductMutation.mutateAsync({
                productId: editingProduct.productId,
                productData: data
            });
            setIsEditDialogOpen(false);
            setEditingProduct(null);
            toast.success('Product updated successfully');
            await queryClient.invalidateQueries({queryKey: ['products']});
            if (isSearching) {
                await searchProductsQuery.refetch();
            } else {
                await fetchProductsQuery.refetch();
            }
        } catch (error) {
            toast.error(`Failed to update product: ${(error as Error).message}`);
        }
    };

    const handleDeleteProduct = async () => {
        if (!deleteProductId) return;

        try {
            await deleteProductMutation.mutateAsync(deleteProductId);
            setIsDeleteDialogOpen(false);
            setDeleteProductId(null);
            toast.success('Product deleted successfully');
            await queryClient.invalidateQueries({queryKey: ['products']});
            if (products.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
            if (isSearching) {
                await searchProductsQuery.refetch();
            } else {
                await fetchProductsQuery.refetch();
            }
        } catch (error) {
            toast.error(`Failed to delete product: ${(error as Error).message}`);
        }
    };

    const openEditDialog = (product: ProductType) => {
        setEditingProduct(product);
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (productId: string) => {
        setDeleteProductId(productId);
        setIsDeleteDialogOpen(true);
    };

    const handlePageChange = async (page: number) => {
        setCurrentPage(page);
        // Refetch with the new page
        if (isSearching) {
            await searchProductsQuery.refetch();
        } else {
            await fetchProductsQuery.refetch();
        }
    };

    const handleItemsPerPageChange = async (value: string) => {
        const newItemsPerPage = parseInt(value, 10);
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
        await queryClient.invalidateQueries({queryKey: ['products']});
    };

    return (
        <div className='flex h-screen bg-gray-50' style={{backgroundColor: theme.background}}>
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
            <div className='flex-1 flex flex-col overflow-hidden'>
                <main className='flex-1 overflow-y-auto p-4 pb-20 lg:pb-0'>
                    <div className='space-y-6'>
                        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6'>
                            <div className="flex flex-row gap-2">
                                <Package style={{color: theme.primary}}/>
                                <h1 className='text-2xl font-bold' style={{color: theme.primary}}>Products</h1>
                            </div>
                            <div className='flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0'>
                                <div className='relative'>
                                    <Input
                                        type='text'
                                        placeholder='Search products...'
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className='pl-10'
                                        style={{borderColor: theme.accent}}
                                    />
                                    <Search
                                        className='absolute left-3 top-2.5'
                                        size={18}
                                        style={{color: theme.primary}}
                                    />
                                </div>
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger
                                        className='w-full sm:w-40'
                                        style={{borderColor: theme.accent}}
                                    >
                                        <SelectValue placeholder='Category'/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(category => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} key="add-dialog">
                                    <DialogTrigger asChild>
                                        <Button
                                            style={{
                                                backgroundColor: theme.primary,
                                                color: 'white',
                                            }}
                                        >
                                            <Plus size={16} className='mr-1'/> Add Product
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className='sm:max-w-[600px]'>
                                        <DialogHeader>
                                            <DialogTitle>Add New Product</DialogTitle>
                                            <DialogDescription>
                                                Fill out the form below to add a new product to the inventory.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <ProductForm
                                            onSubmitAction={handleAddProduct}
                                            isLoading={addProductMutation.isPending}
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
                                                borderColor: theme.secondary,
                                            }}
                                        >
                                            <th className='text-left py-3 px-4' style={{color: theme.text}}>Image</th>
                                            <th className='text-left py-3 px-4' style={{color: theme.text}}>Name</th>
                                            <th className='text-left py-3 px-4 hidden sm:table-cell'
                                                style={{color: theme.text}}>
                                                Category
                                            </th>
                                            <th className='text-left py-3 px-4' style={{color: theme.text}}>Price</th>
                                            <th className='text-left py-3 px-4' style={{color: theme.text}}>Stock</th>
                                            <th className='text-left py-3 px-4' style={{color: theme.text}}>Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {activeQuery.isPending && !products.length ? (
                                            <tr>
                                                <td colSpan={6} className='py-8 text-center text-gray-500'>
                                                    Loading products...
                                                </td>
                                            </tr>
                                        ) : error ? (
                                            <tr>
                                                <td colSpan={6} className='py-8 text-center text-red-500'>
                                                    Error: {error.message || 'An error occurred'}
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
                                                    style={{borderColor: theme.secondary}}
                                                >
                                                    <td className='py-3 px-4'>
                                                        <div className='w-12 h-12 min-h-12 rounded overflow-hidden bg-gray-100 flex items-center justify-center'>
                                                            <CachedImage
                                                                src={product.productImgUrl.replace('c_fill,w_3840', 'c_fill,w_48,h_48')}
                                                                alt={product.productName}
                                                                width={48}
                                                                height={48}
                                                                cacheKey={`product_img_${product.productId}`}
                                                                className='w-full h-full object-cover'
                                                                sizes='48px'
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className='py-3 px-4'>{product.productName}</td>
                                                    <td className='py-3 px-4 hidden sm:table-cell'>
                                                            <span
                                                                className='px-2 py-1 rounded-full text-xs'
                                                                style={{
                                                                    backgroundColor: theme.secondary,
                                                                    color: theme.text,
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
                                                                    color: theme.text,
                                                                }}
                                                            >
                                                                <Edit size={14}/>
                                                            </Button>
                                                            <Button
                                                                variant='outline'
                                                                size='sm'
                                                                onClick={() => openDeleteDialog(product.productId)}
                                                                style={{
                                                                    borderColor: '#EF4444',
                                                                    color: '#EF4444',
                                                                }}
                                                            >
                                                                <Trash2 size={14}/>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={totalProducts}
                                    itemsPerPage={itemsPerPage}
                                    onPageChangeAction={handlePageChange}
                                    onItemsPerPageChangeAction={handleItemsPerPageChange}
                                    itemName="products"
                                />
                            </CardContent>
                        </Card>
                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} key="edit-dialog">
                            <DialogContent className='sm:max-w-[600px]'>
                                <DialogHeader>
                                    <DialogTitle>Edit Product</DialogTitle>
                                    <DialogDescription>
                                        Modify the details below to update the product in the inventory.
                                    </DialogDescription>
                                </DialogHeader>
                                {editingProduct && (
                                    <ProductForm
                                        onSubmitAction={handleUpdateProduct}
                                        initialData={editingProduct}
                                        isLoading={updateProductMutation.isPending}
                                        categories={categories.filter(c => c !== 'All')}
                                    />
                                )}
                            </DialogContent>
                        </Dialog>
                        {/* Delete Confirmation Dialog */}
                        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} key="delete-dialog">
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
                                            color: 'white',
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
        </div>
    );
}